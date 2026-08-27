"use client"

import { LinkButton } from "@/components/ui/LinkButton"
import { ButtonLoader } from "@/components/ui/Loader"
import { CheckoutPricingOverview } from "@/components/checkout/CheckoutPricingOverview"
import { clearCheckoutDraftKeys } from "@/lib/checkout/checkoutDraft"
import { getCheckoutStatusPollDelay, hasCheckoutStatusPollingExpired } from "@/lib/checkout/checkoutStatusPolling"
import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { downloadLicenseFile } from "@/lib/licenses/downloadLicenseFile"
import { getPaymentPeriodSuffix } from "@/lib/subscriptionCalculator"
import type { CheckoutCompletionState, CheckoutPaymentPeriod } from "@code0-tech/crater-graphql-types"
import { Button } from "@code0-tech/pictor"
import { IconCheck, IconCloud, IconDownload, IconX } from "@tabler/icons-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

type SuccessContent = CheckoutData["success"]
type CheckoutStatus = CheckoutCompletionState | "LOADING" | "ERROR" | "INVALID"
type StatusResponse = {
    state: CheckoutCompletionState
    customerId: string
    licenseId: string | null
    configuration: {
        aiTokens: number | null
        customerType: string
        deploymentType: string
        paymentPeriod: CheckoutPaymentPeriod | null
        plan: string | null
        workflowExecutions: number | null
    } | null
    pricing: {
        currency: string
        discount: number
        subtotal: number
        tax: number
        total: number
    } | null
}

interface CheckoutSuccessStatusProps {
    checkoutSearchParams: URLSearchParams
    content: SuccessContent
    errorMessage: string
    locale: AppLocale
    pricingContent: CheckoutData["summary"]
    sculptorUrl?: string | null
    sessionId: string
    subscriptionConfig: SubscriptionConfigData
}

const REQUEST_TIMEOUT_MS = 10_000
const VALID_STATES = new Set<string>(["CHECKOUT_PENDING", "PAYMENT_PENDING", "FULFILLMENT_PENDING", "READY", "FAILED"])
const SETTLED_STATES = new Set<string>(["FULFILLMENT_PENDING", "READY"])
const PAYMENT_PERIODS = new Set<string>(["MONTHLY", "QUARTERLY", "YEARLY"])

function isNullablePositiveInteger(value: unknown) {
    return value === null || (Number.isInteger(value) && Number(value) > 0)
}

function isConfiguration(value: unknown) {
    if (!value || typeof value !== "object") return false
    const configuration = value as Record<string, unknown>
    return (
        typeof configuration.customerType === "string" &&
        typeof configuration.deploymentType === "string" &&
        (configuration.plan === null || typeof configuration.plan === "string") &&
        (configuration.paymentPeriod === null || (typeof configuration.paymentPeriod === "string" && PAYMENT_PERIODS.has(configuration.paymentPeriod))) &&
        isNullablePositiveInteger(configuration.aiTokens) &&
        isNullablePositiveInteger(configuration.workflowExecutions)
    )
}

function isPricing(value: unknown) {
    if (!value || typeof value !== "object") return false
    const pricing = value as Record<string, unknown>
    return typeof pricing.currency === "string" && [pricing.discount, pricing.subtotal, pricing.tax, pricing.total].every((amount) => Number.isInteger(amount) && Number(amount) >= 0)
}

function parseStatusResponse(value: unknown): StatusResponse | null {
    if (!value || typeof value !== "object") return null
    const response = value as Record<string, unknown>
    if (typeof response.state !== "string" || !VALID_STATES.has(response.state as CheckoutCompletionState) || typeof response.customerId !== "string") return null
    if (response.licenseId !== null && typeof response.licenseId !== "string") return null
    if (response.state === "READY" && !response.licenseId) return null
    if (response.configuration !== null && !isConfiguration(response.configuration)) return null
    if (response.pricing !== null && !isPricing(response.pricing)) return null

    return response as StatusResponse
}

export function CheckoutSuccessStatus({ checkoutSearchParams, content, errorMessage, locale, pricingContent, sculptorUrl, sessionId, subscriptionConfig }: CheckoutSuccessStatusProps) {
    const router = useRouter()
    const [status, setStatus] = useState<CheckoutStatus>("LOADING")
    const [completion, setCompletion] = useState<StatusResponse | null>(null)
    const [attempt, setAttempt] = useState(0)
    const [isDownloadingLicense, setIsDownloadingLicense] = useState(false)
    const [licenseDownloadError, setLicenseDownloadError] = useState(false)
    const pollAttemptRef = useRef(0)
    const pollingStartedAtRef = useRef(Date.now())
    const pollTimeoutRef = useRef<number | null>(null)

    const checkStatus = useCallback(
        async (signal: AbortSignal) => {
            const statusUrl = new URL("/api/crater/checkout/status", window.location.origin)
            statusUrl.searchParams.set("sessionId", sessionId)
            const requestController = new AbortController()
            let timedOut = false
            const abortRequest = () => requestController.abort()
            if (signal.aborted) abortRequest()
            else signal.addEventListener("abort", abortRequest, { once: true })
            const requestTimeout = window.setTimeout(() => {
                timedOut = true
                abortRequest()
            }, REQUEST_TIMEOUT_MS)

            let response: Response
            let body: unknown
            try {
                response = await fetch(statusUrl, { cache: "no-store", credentials: "same-origin", signal: requestController.signal })
                try {
                    body = await response.json()
                } catch (error) {
                    if (timedOut) throw error
                    body = null
                }
            } catch (error) {
                if (timedOut) throw new Error("The checkout status request timed out.")
                throw error
            } finally {
                window.clearTimeout(requestTimeout)
                signal.removeEventListener("abort", abortRequest)
            }

            if (!response.ok) {
                const errorCode = body && typeof body === "object" && "errorCode" in body ? body.errorCode : undefined
                if (errorCode === "INVALID_CHECKOUT_STATUS_SESSION") {
                    setStatus("INVALID")
                    return
                }
                throw new Error("Could not check the checkout completion status.")
            }

            const nextCompletion = parseStatusResponse(body)
            if (!nextCompletion) throw new Error("Crater returned an invalid checkout completion status.")

            setCompletion(nextCompletion)
            setStatus(nextCompletion.state)
            if (SETTLED_STATES.has(nextCompletion.state)) clearCheckoutDraftKeys()

            if (nextCompletion.state === "CHECKOUT_PENDING" || nextCompletion.state === "PAYMENT_PENDING" || nextCompletion.state === "FULFILLMENT_PENDING") {
                if (hasCheckoutStatusPollingExpired(pollingStartedAtRef.current, Date.now())) {
                    setStatus("ERROR")
                    return
                }

                const delay = getCheckoutStatusPollDelay(pollAttemptRef.current)
                pollAttemptRef.current += 1
                pollTimeoutRef.current = window.setTimeout(() => setAttempt((current) => current + 1), delay)
            }
        },
        [sessionId]
    )

    useEffect(() => {
        if (status === "READY" || status === "FAILED" || status === "INVALID") return
        const controller = new AbortController()

        void checkStatus(controller.signal).catch((error: unknown) => {
            if (error instanceof DOMException && error.name === "AbortError") return
            setStatus("ERROR")
        })

        return () => {
            controller.abort()
            if (pollTimeoutRef.current !== null) window.clearTimeout(pollTimeoutRef.current)
        }
    }, [attempt, checkStatus])

    // A declined or otherwise failed payment should drop the customer back into checkout with their
    // configuration intact and the failure explained there, not leave them stranded on this status page.
    useEffect(() => {
        if (status !== "FAILED") return

        const nextParams = new URLSearchParams(checkoutSearchParams)
        nextParams.delete("session_id")
        nextParams.set("paymentFailed", "1")
        router.replace(`/${locale}/checkout?${nextParams.toString()}`)
    }, [checkoutSearchParams, locale, router, status])

    const fulfillmentConfirmed = status === "FULFILLMENT_PENDING" || status === "READY"
    const statusFailed = status === "FAILED" || status === "INVALID"
    const heading = status === "FAILED" ? content.failedHeading : status === "INVALID" ? content.invalidHeading : fulfillmentConfirmed ? content.heading : null
    const description = status === "FAILED" ? content.failedDescription : status === "INVALID" ? content.invalidDescription : fulfillmentConfirmed ? content.description : null
    const licenseReturnPath =
        status === "READY" && completion?.licenseId ? `/${locale}/licenses/customer/${encodeURIComponent(completion.customerId)}/license/${encodeURIComponent(completion.licenseId)}` : null
    const licenseAccessUrl = licenseReturnPath ? `/api/crater/licenses/access?locale=${encodeURIComponent(locale)}&returnPath=${encodeURIComponent(licenseReturnPath)}` : null
    const confirmedConfiguration = fulfillmentConfirmed ? completion?.configuration : null
    const confirmedPricing = fulfillmentConfirmed ? completion?.pricing : null
    const paymentPeriod = confirmedConfiguration?.paymentPeriod?.toLowerCase() as "monthly" | "quarterly" | "yearly" | undefined
    const planKey = confirmedConfiguration?.plan?.toLowerCase()
    const planTitle = planKey === "pro" || planKey === "max" || planKey === "custom" ? subscriptionConfig.packages[planKey].title : subscriptionConfig.packages.custom.title
    const currencyDivisor = confirmedPricing
        ? 10 **
          (new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", { style: "currency", currency: confirmedPricing.currency.toUpperCase() }).resolvedOptions().maximumFractionDigits ?? 2)
        : 100

    const downloadSelfHostedLicense = async () => {
        if (!completion?.licenseId || isDownloadingLicense) return

        setIsDownloadingLicense(true)
        setLicenseDownloadError(false)
        try {
            await downloadLicenseFile(completion.licenseId)
        } catch {
            setLicenseDownloadError(true)
        } finally {
            setIsDownloadingLicense(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center gap-2">
            {status === "READY" || status === "ERROR" ? (
                <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand shadow-[inset_0_1px_1px_#bfbfbf1a]">
                    {status === "READY" ? <IconCheck aria-hidden="true" size={28} /> : <IconX aria-hidden="true" size={28} />}
                </div>
            ) : null}
            {heading && <h1 className="text-3xl font-semibold text-white">{heading}</h1>}
            {description && <p className="text-secondary max-w-lg">{description}</p>}
            {confirmedConfiguration && confirmedPricing ? (
                <div className="my-4 w-full text-left">
                    <CheckoutPricingOverview
                        confirmedPricing={{
                            aiTokens: confirmedConfiguration.aiTokens,
                            currency: confirmedPricing.currency,
                            customerType: confirmedConfiguration.customerType === "business" ? "b2b" : confirmedConfiguration.customerType === "personal" ? "b2c" : confirmedConfiguration.customerType,
                            deployment: confirmedConfiguration.deploymentType,
                            discountAmount: confirmedPricing.discount / currencyDivisor,
                            periodSuffix: paymentPeriod ? getPaymentPeriodSuffix(paymentPeriod, subscriptionConfig.paymentPeriod) : "",
                            planTitle,
                            subtotalPrice: confirmedPricing.subtotal / currencyDivisor,
                            taxAmount: confirmedPricing.tax / currencyDivisor,
                            totalPrice: confirmedPricing.total / currencyDivisor,
                            workflowExecutions: confirmedConfiguration.workflowExecutions,
                        }}
                        content={pricingContent}
                        locale={locale}
                        subscriptionConfig={subscriptionConfig}
                    />
                </div>
            ) : null}
            {fulfillmentConfirmed && <p className="text-sm text-tertiary mb-4">{content.receiptHint}</p>}
            {status === "ERROR" && <p className="text-secondary">{errorMessage}</p>}
            {status === "READY" && licenseAccessUrl ? (
                <div className="flex flex-col items-center gap-2">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <Link href={licenseAccessUrl} target="_blank" rel="noreferrer">
                            <Button>{content.licenseDashboardLabel}</Button>
                        </Link>
                        {completion?.configuration?.deploymentType === "cloud" && sculptorUrl ? (
                            <Link href={sculptorUrl} target="_blank" rel="noreferrer">
                                <Button variant="filled" className="bg-white/80! hover:bg-white! text-primary!">
                                    <IconCloud aria-hidden="true" size={17} />
                                    {content.sculptorLabel}
                                </Button>
                            </Link>
                        ) : completion?.configuration?.deploymentType === "self_hosted" ? (
                            <Button
                                type="button"
                                variant="filled"
                                className="bg-white/80! hover:bg-white! text-primary!"
                                disabled={isDownloadingLicense}
                                onClick={() => void downloadSelfHostedLicense()}
                            >
                                {isDownloadingLicense ? <ButtonLoader label={content.licenseDownloadLabel} /> : <IconDownload aria-hidden="true" size={17} />}
                                {!isDownloadingLicense ? content.licenseDownloadLabel : null}
                            </Button>
                        ) : null}
                    </div>
                    {licenseDownloadError ? (
                        <p role="alert" className="text-sm text-error">
                            {content.licenseDownloadError}
                        </p>
                    ) : null}
                </div>
            ) : status === "ERROR" ? (
                <Button
                    type="button"
                    variant="normal"
                    onClick={() => {
                        pollingStartedAtRef.current = Date.now()
                        pollAttemptRef.current = 0
                        setStatus("LOADING")
                        setAttempt((current) => current + 1)
                    }}
                >
                    {content.licenseStatusRetryLabel}
                </Button>
            ) : statusFailed ? (
                <LinkButton href={`/${locale}/checkout`} showArrow={false} className="border-b-0">
                    {content.checkoutRetryLabel}
                </LinkButton>
            ) : (
                <Button type="button" variant="normal" disabled>
                    <ButtonLoader label={content.licensePendingLabel} />
                </Button>
            )}
        </div>
    )
}
