"use client"

import { FilledButtonLink } from "@/components/ui/FilledButtonLink"
import { LinkButton } from "@/components/ui/LinkButton"
import { ButtonLoader } from "@/components/ui/Loader"
import type { CheckoutSuccessSummary } from "@/lib/checkout/checkoutSuccessSummary"
import { clearCheckoutDraftKeys } from "@/lib/checkout/checkoutDraft"
import { getCheckoutStatusPollDelay, hasCheckoutStatusPollingExpired } from "@/lib/checkout/checkoutStatusPolling"
import type { CheckoutData } from "@/lib/cms"
import type { CheckoutCompletionState } from "@code0-tech/crater-graphql-types"
import { Button } from "@code0-tech/pictor"
import { useCallback, useEffect, useRef, useState } from "react"

type SuccessContent = CheckoutData["success"]
type CheckoutStatus = CheckoutCompletionState | "LOADING" | "ERROR" | "INVALID"
type StatusResponse = {
    state: CheckoutCompletionState
    customerId: string
    licenseId: string | null
}

interface CheckoutSuccessStatusProps {
    content: SuccessContent
    locale: string
    sessionId: string
    summary?: CheckoutSuccessSummary | null
}

const REQUEST_TIMEOUT_MS = 10_000
const VALID_STATES = new Set<string>(["CHECKOUT_PENDING", "PAYMENT_PENDING", "FULFILLMENT_PENDING", "READY", "FAILED"])
const SETTLED_STATES = new Set<string>(["FULFILLMENT_PENDING", "READY"])

function parseStatusResponse(value: unknown): StatusResponse | null {
    if (!value || typeof value !== "object") return null
    const response = value as Record<string, unknown>
    if (typeof response.state !== "string" || !VALID_STATES.has(response.state as CheckoutCompletionState) || typeof response.customerId !== "string") return null
    if (response.licenseId !== null && typeof response.licenseId !== "string") return null
    if (response.state === "READY" && !response.licenseId) return null

    return response as StatusResponse
}

export function CheckoutSuccessStatus({ content, locale, sessionId, summary }: CheckoutSuccessStatusProps) {
    const [status, setStatus] = useState<CheckoutStatus>("LOADING")
    const [completion, setCompletion] = useState<StatusResponse | null>(null)
    const [attempt, setAttempt] = useState(0)
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

    const fulfillmentConfirmed = status === "FULFILLMENT_PENDING" || status === "READY"
    const statusFailed = status === "FAILED" || status === "INVALID"
    const heading = status === "FAILED" ? content.failedHeading : status === "INVALID" ? content.invalidHeading : fulfillmentConfirmed ? content.heading : null
    const description = status === "FAILED" ? content.failedDescription : status === "INVALID" ? content.invalidDescription : fulfillmentConfirmed ? content.description : null
    const licenseReturnPath =
        status === "READY" && completion?.licenseId ? `/${locale}/licenses/customer/${encodeURIComponent(completion.customerId)}/license/${encodeURIComponent(completion.licenseId)}` : null
    const licenseAccessUrl = licenseReturnPath ? `/api/crater/licenses/access?locale=${encodeURIComponent(locale)}&returnPath=${encodeURIComponent(licenseReturnPath)}` : null

    return (
        <div className="flex flex-col items-center justify-center gap-3">
            {heading && <h1 className="text-3xl font-semibold text-white">{heading}</h1>}
            {description && <p className="text-secondary">{description}</p>}
            {fulfillmentConfirmed && summary && summary.rows.length > 0 && (
                <div className="my-2 w-full max-w-sm space-y-2 rounded-2xl border border-white/10 p-4 text-left text-sm">
                    <p className="text-secondary">{summary.title}</p>
                    <dl className="space-y-2">
                        {summary.rows.map((row) => (
                            <div key={row.id} className="flex items-start justify-between gap-4">
                                <dt className="text-tertiary">{row.label}</dt>
                                <dd className="shrink-0 text-white">{row.value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            )}
            {fulfillmentConfirmed && <p className="text-sm text-tertiary">{content.receiptHint}</p>}
            {status === "ERROR" && <p className="text-secondary">{content.licenseStatusError}</p>}
            {status === "READY" && <p className="text-sm text-tertiary">{content.licenseReadyLabel}</p>}
            {status === "READY" && licenseAccessUrl ? (
                <FilledButtonLink href={licenseAccessUrl} target="_blank" rel="noreferrer">
                    {content.licenseDashboardLabel}
                </FilledButtonLink>
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
