"use client"

import { useEffect, useSyncExternalStore, type RefObject } from "react"

export type CheckoutElementHeightKey = "contactDetails" | "billingAddress" | "billingAddressWithTaxId" | "payment"

// First-visit estimates derived from the Stripe appearance: a row is a 12px label with 7px spacing above an input with
// 11px padding (~62px), rows are 16px apart. After the first visit the measured heights replace them.
export const FALLBACK_ELEMENT_HEIGHTS: Record<CheckoutElementHeightKey, number> = {
    contactDetails: 62,
    billingAddress: 374,
    billingAddressWithTaxId: 452,
    payment: 300,
}

const STORAGE_KEY = "code0.checkout.elementHeights"
const MEASURE_SETTLE_MS = 400
const MAX_PLAUSIBLE_HEIGHT = 1_200

// Stripe lays its fields out differently on narrow screens, so heights are remembered per layout.
function storageField(key: CheckoutElementHeightKey) {
    return `${window.matchMedia?.("(min-width: 64rem)").matches ? "desktop" : "mobile"}:${key}`
}

function readHeights(): Record<string, unknown> {
    try {
        const stored: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}")
        return stored && typeof stored === "object" ? (stored as Record<string, unknown>) : {}
    } catch {
        return {}
    }
}

function readHeight(key: CheckoutElementHeightKey) {
    const height = readHeights()[storageField(key)]
    return typeof height === "number" && height > 0 && height <= MAX_PLAUSIBLE_HEIGHT ? height : null
}

function writeHeight(key: CheckoutElementHeightKey, height: number) {
    if (height <= 0 || height > MAX_PLAUSIBLE_HEIGHT) return
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readHeights(), [storageField(key)]: height }))
    } catch {
        // Remembering the height only refines the placeholder; the estimate still applies without storage.
    }
}

function subscribe(onChange: () => void) {
    window.addEventListener("storage", onChange)
    return () => window.removeEventListener("storage", onChange)
}

/** Height a Stripe element had when it last finished loading, or an estimate before it has ever been measured. */
export function useElementHeight(key: CheckoutElementHeightKey) {
    const stored = useSyncExternalStore(
        subscribe,
        () => readHeight(key),
        () => null
    )
    return stored ?? FALLBACK_ELEMENT_HEIGHTS[key]
}

/** Remembers the settled height of a Stripe element once it is ready, so the next placeholder matches it. */
export function useMeasureElementHeight(key: CheckoutElementHeightKey, ready: boolean, ref: RefObject<HTMLElement | null>) {
    useEffect(() => {
        const element = ref.current
        if (!ready || !element || typeof ResizeObserver === "undefined") return

        let timer: number | undefined
        const observer = new ResizeObserver(() => {
            window.clearTimeout(timer)
            // Stripe resizes its iframe a few times right after ready; only the settled height is useful.
            timer = window.setTimeout(() => {
                writeHeight(key, Math.round(element.getBoundingClientRect().height))
                observer.disconnect()
            }, MEASURE_SETTLE_MS)
        })
        observer.observe(element)

        return () => {
            observer.disconnect()
            window.clearTimeout(timer)
        }
    }, [key, ready, ref])
}
