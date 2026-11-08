"use client"

import type { CheckoutSessionData } from "@/lib/checkout/client"
import { useCallback, useEffect, useState } from "react"

// A replacement session that never reports ready must not keep the previous form on screen forever.
const SESSION_SWAP_TIMEOUT_MS = 10_000

/**
 * Keeps the previous Checkout Session on screen while a new one (another customer, or a refresh before expiry) loads
 * invisibly underneath, and swaps them once the new one is ready, instead of tearing the form down in between.
 */
export function useSessionSwap(checkoutSession: CheckoutSessionData | null) {
    const [shownSession, setShownSession] = useState(checkoutSession)
    const [retiringSession, setRetiringSession] = useState<CheckoutSessionData | null>(null)

    if (checkoutSession !== shownSession) {
        setShownSession(checkoutSession)
        setRetiringSession(shownSession && checkoutSession ? shownSession : null)
    }

    useEffect(() => {
        if (!retiringSession) return
        const timer = window.setTimeout(() => setRetiringSession(null), SESSION_SWAP_TIMEOUT_MS)
        return () => window.clearTimeout(timer)
    }, [retiringSession])

    const finishSwap = useCallback(() => setRetiringSession(null), [])
    return { finishSwap, retiringSession }
}
