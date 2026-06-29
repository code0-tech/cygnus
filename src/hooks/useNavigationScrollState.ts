"use client"

import { useCallback, useRef, useSyncExternalStore } from "react"

interface UseNavigationScrollStateOptions {
    onScrollStateChange?: (isScrolled: boolean) => void
    onScroll?: () => void
}

export function useNavigationScrollState(options: UseNavigationScrollStateOptions = {}) {
    const { onScrollStateChange, onScroll } = options
    const isScrolledRef = useRef(false)
    const onScrollRef = useRef(onScroll)
    const onScrollStateChangeRef = useRef(onScrollStateChange)

    onScrollRef.current = onScroll
    onScrollStateChangeRef.current = onScrollStateChange

    const getScrollState = useCallback(() => {
        const nextIsScrolled = isScrolledRef.current ? window.scrollY > 3 : window.scrollY > 8
        isScrolledRef.current = nextIsScrolled
        return nextIsScrolled
    }, [])

    const subscribe = useCallback((onStoreChange: () => void) => {
        let frame = 0

        const handleScroll = () => {
            if (frame) return

            frame = window.requestAnimationFrame(() => {
                frame = 0
                const previousIsScrolled = isScrolledRef.current
                const nextIsScrolled = getScrollState()

                if (previousIsScrolled !== nextIsScrolled) {
                    onScrollStateChangeRef.current?.(nextIsScrolled)
                    onStoreChange()
                }

                onScrollRef.current?.()
            })
        }

        window.addEventListener("scroll", handleScroll, { passive: true })

        return () => {
            if (frame) window.cancelAnimationFrame(frame)
            window.removeEventListener("scroll", handleScroll)
        }
    }, [getScrollState])

    return useSyncExternalStore(subscribe, getScrollState, () => false)
}
