"use client"

import { useSyncExternalStore } from "react"

const DESKTOP_QUERY = "(min-width: 64rem)"

function subscribeToLayout(onChange: () => void) {
    const query = window.matchMedia(DESKTOP_QUERY)
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
}

/** `true` below the `lg` breakpoint, where the summary and the form are separate views. Desktop during SSR. */
export function useIsMobileCheckout() {
    return useSyncExternalStore(
        subscribeToLayout,
        () => !window.matchMedia(DESKTOP_QUERY).matches,
        () => false
    )
}
