"use client"

import { useEffect, useSyncExternalStore } from "react"

const DESKTOP_QUERY = "(min-width: 64rem)"

function subscribeToLayout(onChange: () => void) {
    const query = window.matchMedia(DESKTOP_QUERY)
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
}

/** `true` below the `lg` breakpoint, where the checkout form lives in a bottom sheet. Desktop during SSR. */
export function useIsMobileCheckout() {
    return useSyncExternalStore(
        subscribeToLayout,
        () => !window.matchMedia(DESKTOP_QUERY).matches,
        () => false
    )
}

/** Stops the page behind an open sheet from scrolling along, including iOS overscroll. */
export function useScrollLock(locked: boolean) {
    useEffect(() => {
        if (!locked) return
        const root = document.documentElement
        const previousOverflow = root.style.overflow
        const previousOverscroll = root.style.overscrollBehavior
        root.style.overflow = "hidden"
        root.style.overscrollBehavior = "none"
        return () => {
            root.style.overflow = previousOverflow
            root.style.overscrollBehavior = previousOverscroll
        }
    }, [locked])
}
