"use client"

import { FilledButtonLink } from "@/components/ui/FilledButtonLink"
import { ButtonLoader } from "@/components/ui/Loader"
import { clearCheckoutDraftKeys } from "@/lib/checkout/checkoutDraft"
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

const POLL_INTERVAL_MS = 2_000
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

export function CheckoutSuccessStatus({ content, locale, sessionId }: { content: SuccessContent; locale: string; sessionId: string }) {
    const [status, setStatus] = useState<CheckoutStatus>("LOADING")
    const [completion, setCompletion] = useState<StatusResponse | null>(null)
    const [attempt, setAttempt] = useState(0)
    const timeoutRef = useRef<number | null>(null)

    const checkStatus = useCallback(
        async (signal: AbortSignal) => {
            const statusUrl = new URL("/api/crater/checkout/status", window.location.origin)
            statusUrl.searchParams.set("sessionId", sessionId)
            const response = await fetch(statusUrl, { cache: "no-store", credentials: "same-origin", signal })
            const body: unknown = await response.json().catch(() => null)

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
                timeoutRef.current = window.setTimeout(() => setAttempt((current) => current + 1), POLL_INTERVAL_MS)
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
            if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
        }
    }, [attempt, checkStatus])

    const fulfillmentConfirmed = status === "FULFILLMENT_PENDING" || status === "READY"
    const statusFailed = status === "FAILED" || status === "INVALID"
    const licenseReturnPath =
        status === "READY" && completion?.licenseId
            ? `/${locale}/licenses/customer/${encodeURIComponent(completion.customerId)}/license/${encodeURIComponent(completion.licenseId)}`
            : null
    const licenseAccessUrl = licenseReturnPath
        ? `/api/crater/licenses/access?locale=${encodeURIComponent(locale)}&returnPath=${encodeURIComponent(licenseReturnPath)}`
        : null

    return (
        <div className="flex flex-col items-center justify-center gap-3">
            {fulfillmentConfirmed ? (
                <>
                    <h1 className="text-3xl font-semibold text-white">{content.heading}</h1>
                    <p className="text-secondary">{content.description}</p>
                </>
            ) : null}
            <p aria-live="polite" className="text-sm text-secondary">
                {status === "READY" ? content.licenseReadyLabel : status === "ERROR" || statusFailed ? content.licenseStatusError : content.licensePendingLabel}
            </p>
            {status === "READY" && licenseAccessUrl ? (
                <FilledButtonLink href={licenseAccessUrl} target="_blank" rel="noreferrer">
                    {content.licenseDashboardLabel}
                </FilledButtonLink>
            ) : status === "ERROR" ? (
                <Button
                    type="button"
                    variant="normal"
                    onClick={() => {
                        setStatus("LOADING")
                        setAttempt((current) => current + 1)
                    }}
                >
                    {content.licenseStatusRetryLabel}
                </Button>
            ) : statusFailed ? null : (
                <Button type="button" variant="normal" disabled>
                    <ButtonLoader label={content.licensePendingLabel} />
                </Button>
            )}
        </div>
    )
}
