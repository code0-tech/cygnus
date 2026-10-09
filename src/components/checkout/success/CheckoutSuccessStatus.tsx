"use client"

import type { PaymentPeriod } from "@/lib/subscription/types"
import { checkoutFetch, getCheckoutCompletionStatus, getCheckoutStatusPollDelay, hasCheckoutStatusPollingExpired } from "@/lib/checkout/client"
import { LinkButton } from "@/components/ui/LinkButton"
import { ButtonLoader } from "@/components/ui/Loader"
import { CheckoutPricingOverview } from "@/components/checkout/summary/CheckoutPricingOverview"
import { clearCheckoutContactDraft } from "@/lib/checkout/checkoutDraft"
import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { downloadLicenseFile } from "@/lib/licenses/client"
import { getPaymentPeriodSuffix } from "@/lib/subscription/calculator"
import type { CheckoutCompletionState } from "@code0-tech/crater-graphql-types"
import { Button } from "@code0-tech/pictor"
import { IconCheck, IconCloud, IconDownload, IconX } from "@tabler/icons-react"
import { AnimatePresence, m as motion, useReducedMotion, type Variants } from "motion/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

type SuccessContent = CheckoutData["success"]
type CheckoutStatus = `${CheckoutCompletionState}` | "LOADING" | "ERROR" | "INVALID"
type StatusResponse = {
    state: `${CheckoutCompletionState}`
    customerId: string
    licenseId: string | null
    configuration: {
        aiTokens: number | null
        customerType: string
        deploymentType: string
        paymentPeriod: PaymentPeriod | null
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
    checkoutSearchParams: string
    content: SuccessContent
    errorMessage: string
    locale: AppLocale
    pricingContent: CheckoutData["summary"]
    sculptorUrl?: string | null
    sessionId: string
    subscriptionConfig: SubscriptionConfigData
}

interface CheckoutSuccessStatusViewProps extends Omit<CheckoutSuccessStatusProps, "checkoutSearchParams" | "sessionId"> {
    status: CheckoutStatus
    completion: StatusResponse | null
    isGuestCheckout: boolean
    isDownloadingLicense: boolean
    licenseDownloadError: boolean
    onDownloadLicense: () => void
    onRetry: () => void
}

const VALID_STATES = new Set<string>(["CHECKOUT_PENDING", "PAYMENT_PENDING", "FULFILLMENT_PENDING", "READY", "FAILED"])
const SETTLED_STATES = new Set<string>(["FULFILLMENT_PENDING", "READY"])
const PAYMENT_PERIODS = new Set<string>(["monthly", "quarterly", "yearly"])

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
    if (typeof response.state !== "string" || !VALID_STATES.has(response.state) || typeof response.customerId !== "string") return null
    if (response.licenseId !== null && typeof response.licenseId !== "string") return null
    if (response.state === "READY" && !response.licenseId) return null
    if (response.configuration !== null && !isConfiguration(response.configuration)) return null
    if (response.pricing !== null && !isPricing(response.pricing)) return null

    return response as StatusResponse
}

export function CheckoutSuccessStatus({ checkoutSearchParams, content, errorMessage, locale, pricingContent, sculptorUrl, sessionId, subscriptionConfig }: CheckoutSuccessStatusProps) {
    const isGuestCheckout = new URLSearchParams(checkoutSearchParams).has("guestCheckout")
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
            const { body, ok } = await getCheckoutCompletionStatus(sessionId, signal)

            if (!ok) {
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
            if (SETTLED_STATES.has(nextCompletion.state)) clearCheckoutContactDraft()

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

    useEffect(() => {
        if (status !== "FAILED") return

        const nextParams = new URLSearchParams(checkoutSearchParams)
        nextParams.delete("session_id")
        const guest = nextParams.has("guestCheckout")
        nextParams.delete("guestCheckout")
        nextParams.set("paymentFailed", "1")
        router.replace(`/${locale}/checkout${guest ? "/login" : ""}?${nextParams.toString()}`)
    }, [checkoutSearchParams, locale, router, status])

    const downloadSelfHostedLicense = async () => {
        if (!completion?.licenseId || isDownloadingLicense) return

        setIsDownloadingLicense(true)
        setLicenseDownloadError(false)
        try {
            await downloadLicenseFile(completion.licenseId, checkoutFetch)
        } catch {
            setLicenseDownloadError(true)
        } finally {
            setIsDownloadingLicense(false)
        }
    }

    return (
        <CheckoutSuccessStatusView
            completion={completion}
            content={content}
            errorMessage={errorMessage}
            isDownloadingLicense={isDownloadingLicense}
            isGuestCheckout={isGuestCheckout}
            licenseDownloadError={licenseDownloadError}
            locale={locale}
            onDownloadLicense={() => void downloadSelfHostedLicense()}
            onRetry={() => {
                pollingStartedAtRef.current = Date.now()
                pollAttemptRef.current = 0
                setStatus("LOADING")
                setAttempt((current) => current + 1)
            }}
            pricingContent={pricingContent}
            sculptorUrl={sculptorUrl}
            status={status}
            subscriptionConfig={subscriptionConfig}
        />
    )
}

function CheckoutSuccessStatusView({
    completion,
    content,
    errorMessage,
    isDownloadingLicense,
    isGuestCheckout,
    licenseDownloadError,
    locale,
    onDownloadLicense,
    onRetry,
    pricingContent,
    sculptorUrl,
    status,
    subscriptionConfig,
}: CheckoutSuccessStatusViewProps) {
    const reducedMotion = useReducedMotion()
    const stagger: Variants = {
        hidden: {},
        show: { transition: { staggerChildren: reducedMotion ? 0 : 0.12, delayChildren: reducedMotion ? 0 : 0.08 } },
    }
    const reveal: Variants = {
        hidden: { opacity: 0, y: reducedMotion ? 0 : 12, filter: reducedMotion ? "none" : "blur(4px)" },
        show: { opacity: 1, y: 0, filter: "none", transition: { duration: reducedMotion ? 0.15 : 0.5, ease: [0.22, 1, 0.36, 1] } },
    }
    const fulfillmentConfirmed = status === "FULFILLMENT_PENDING" || status === "READY"
    const statusFailed = status === "FAILED" || status === "INVALID"
    const heading = status === "FAILED" ? content.failedHeading : status === "INVALID" ? content.invalidHeading : fulfillmentConfirmed ? content.heading : null
    const description = status === "FAILED" ? content.failedDescription : status === "INVALID" ? content.invalidDescription : fulfillmentConfirmed ? content.description : null
    const licenseAccessUrl =
        status === "READY" && completion?.licenseId ? `/api/crater/licenses/access?${new URLSearchParams({ locale, customerId: completion.customerId, licenseId: completion.licenseId })}` : null
    const confirmedConfiguration = fulfillmentConfirmed ? completion?.configuration : null
    const confirmedPricing = fulfillmentConfirmed ? completion?.pricing : null
    const paymentPeriod = confirmedConfiguration?.paymentPeriod ?? undefined
    const planKey = confirmedConfiguration?.plan
    const planTitle = planKey === "pro" || planKey === "max" || planKey === "custom" ? subscriptionConfig.packages[planKey].title : subscriptionConfig.packages.custom.title
    const currencyDivisor = confirmedPricing
        ? 10 ** (new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", { style: "currency", currency: confirmedPricing.currency.toUpperCase() }).resolvedOptions().maximumFractionDigits ?? 2)
        : 100

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={fulfillmentConfirmed ? "confirmed" : status === "ERROR" ? "error" : statusFailed ? "failed" : "pending"}
                variants={stagger}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, transition: { duration: reducedMotion ? 0 : 0.2 } }}
                className="flex flex-col items-center justify-center gap-2"
            >
                {fulfillmentConfirmed || status === "ERROR" ? (
                    <div className="mb-2 size-12 shrink-0">
                        {status === "READY" || status === "ERROR" ? (
                            <motion.div
                                initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: "spring", stiffness: 180, damping: 18 }}
                                className={`flex size-12 items-center justify-center rounded-2xl shadow-[inset_0_1px_1px_#bfbfbf1a] ${status === "READY" ? "bg-brand/10 text-brand" : "bg-error/10 text-error"}`}
                            >
                                {status === "READY" ? <IconCheck aria-hidden="true" size={28} /> : <IconX aria-hidden="true" size={28} />}
                            </motion.div>
                        ) : null}
                    </div>
                ) : null}
                {heading && (
                    <motion.h1 variants={reveal} className="text-3xl font-semibold text-white">
                        {heading}
                    </motion.h1>
                )}
                {description && (
                    <motion.p variants={reveal} className="text-secondary max-w-lg">
                        {description}
                    </motion.p>
                )}
                {fulfillmentConfirmed && isGuestCheckout && (
                    <motion.p variants={reveal} role="status" className="my-2 max-w-lg rounded-2xl border border-brand/10 bg-brand/5 p-4 text-sm text-brand">
                        {content.guestAccountHint}
                    </motion.p>
                )}
                {confirmedConfiguration && confirmedPricing ? (
                    <motion.div variants={reveal} className="my-2 w-full text-left">
                        <CheckoutPricingOverview
                            confirmedPricing={{
                                aiTokens: confirmedConfiguration.aiTokens,
                                currency: confirmedPricing.currency,
                                customerType:
                                    confirmedConfiguration.customerType === "business" ? "b2b" : confirmedConfiguration.customerType === "personal" ? "b2c" : confirmedConfiguration.customerType,
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
                    </motion.div>
                ) : null}
                {fulfillmentConfirmed && (
                    <motion.p variants={reveal} className="text-sm text-tertiary mb-4">
                        {content.receiptHint}
                    </motion.p>
                )}
                {status === "ERROR" && (
                    <motion.p variants={reveal} className="text-secondary">
                        {errorMessage}
                    </motion.p>
                )}
                <motion.div variants={reveal}>
                    <AnimatePresence mode="wait" initial={false}>
                        {status === "READY" && licenseAccessUrl ? (
                            <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    {!isGuestCheckout && (
                                        <Link href={licenseAccessUrl} target="_blank" rel="noreferrer">
                                            <Button>{content.licenseDashboardLabel}</Button>
                                        </Link>
                                    )}
                                    {completion?.configuration?.deploymentType === "cloud" && sculptorUrl ? (
                                        <Link href={sculptorUrl} target="_blank" rel="noreferrer">
                                            <Button variant="filled" className="bg-white/80! hover:bg-white! text-primary!">
                                                <IconCloud aria-hidden="true" size={17} />
                                                {content.sculptorLabel}
                                            </Button>
                                        </Link>
                                    ) : completion?.configuration?.deploymentType === "self_hosted" ? (
                                        <Button type="button" variant="filled" className="bg-white/80! hover:bg-white! text-primary!" disabled={isDownloadingLicense} onClick={onDownloadLicense}>
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
                            </motion.div>
                        ) : status === "ERROR" ? (
                            <motion.div key="retry" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <Button type="button" variant="normal" onClick={onRetry}>
                                    {content.licenseStatusRetryLabel}
                                </Button>
                            </motion.div>
                        ) : statusFailed ? (
                            <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <LinkButton href={`/${locale}/checkout`} showArrow={false} className="border-b-0">
                                    {content.checkoutRetryLabel}
                                </LinkButton>
                            </motion.div>
                        ) : (
                            <motion.div key="pending" exit={{ opacity: 0, transition: { duration: reducedMotion ? 0 : 0.2 } }}>
                                <Button type="button" variant="normal" disabled>
                                    <ButtonLoader label={content.licensePendingLabel} />
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
