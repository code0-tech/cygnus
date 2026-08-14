"use client"

import type { CheckoutData } from "@/lib/cms"
import { FilledButtonLink } from "@/components/ui/FilledButtonLink"
import { ButtonLoader } from "@/components/ui/Loader"
import { Button } from "@code0-tech/pictor"
import { useCallback, useEffect, useRef, useState } from "react"

type SuccessContent = CheckoutData["success"]
type LicenseStatus = "pending" | "ready" | "error"
const POLL_INTERVAL_MS = 2_000

export function CheckoutSuccessStatus({ content, customerId, locale, startedAt }: { content: SuccessContent; customerId: string | null; locale: string; startedAt: number | null }) {
    const [status, setStatus] = useState<LicenseStatus>(customerId && startedAt ? "pending" : "ready")
    const [attempt, setAttempt] = useState(0)
    const timeoutRef = useRef<number | null>(null)

    const checkStatus = useCallback(
        async (signal: AbortSignal) => {
            if (!customerId || !startedAt) return

            const statusUrl = new URL("/api/crater/checkout/status", window.location.origin)
            statusUrl.searchParams.set("customerId", customerId)
            statusUrl.searchParams.set("startedAt", String(startedAt))
            const response = await fetch(statusUrl, { cache: "no-store", credentials: "same-origin", signal })
            if (!response.ok) throw new Error("Could not check the checkout license status.")
            const body: unknown = await response.json()
            const ready = Boolean(body && typeof body === "object" && "ready" in body && body.ready === true)

            if (ready) {
                setStatus("ready")
                return
            }

            setStatus("pending")
            timeoutRef.current = window.setTimeout(() => setAttempt((current) => current + 1), POLL_INTERVAL_MS)
        },
        [customerId, startedAt]
    )

    useEffect(() => {
        if (status === "ready") return
        const controller = new AbortController()

        void checkStatus(controller.signal).catch((error: unknown) => {
            if (error instanceof DOMException && error.name === "AbortError") return
            setStatus("error")
        })

        return () => {
            controller.abort()
            if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
        }
    }, [attempt, checkStatus])

    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <p aria-live="polite" className="text-sm text-secondary">
                {status === "ready" ? content.licenseReadyLabel : status === "error" ? content.licenseStatusError : content.licensePendingLabel}
            </p>
            {status === "ready" ? (
                <FilledButtonLink href={`/api/crater/licenses/access?locale=${locale}`} target="_blank" rel="noreferrer">
                    {content.licenseDashboardLabel}
                </FilledButtonLink>
            ) : status === "error" ? (
                <Button
                    type="button"
                    variant="normal"
                    onClick={() => {
                        setStatus("pending")
                        setAttempt((current) => current + 1)
                    }}
                >
                    {content.licenseStatusRetryLabel}
                </Button>
            ) : (
                <Button type="button" variant="normal" disabled>
                    <ButtonLoader label={content.licensePendingLabel} />
                </Button>
            )}
        </div>
    )
}
