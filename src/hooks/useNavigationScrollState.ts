"use client"

import { useEffect, useRef, useState } from "react"

interface UseNavigationScrollStateOptions {
    onScrollStateChange?: (isScrolled: boolean) => void
    onScroll?: () => void
}

export function useNavigationScrollState(options: UseNavigationScrollStateOptions = {}) {
    const { onScrollStateChange, onScroll } = options
    const [isScrolled, setIsScrolled] = useState(false)
    const onScrollRef = useRef(onScroll)
    const onScrollStateChangeRef = useRef(onScrollStateChange)

    onScrollRef.current = onScroll
    onScrollStateChangeRef.current = onScrollStateChange

    useEffect(() => {
        let frame = 0
        const scrollOpenThreshold = 8
        const scrollCloseThreshold = 3

        const handleScroll = () => {
            if (frame) return

            frame = window.requestAnimationFrame(() => {
                frame = 0

                setIsScrolled((previousIsScrolled) => {
                    const nextIsScrolled = previousIsScrolled ? window.scrollY > scrollCloseThreshold : window.scrollY > scrollOpenThreshold

                    if (previousIsScrolled !== nextIsScrolled) {
                        onScrollStateChangeRef.current?.(nextIsScrolled)
                    }

                    return previousIsScrolled === nextIsScrolled ? previousIsScrolled : nextIsScrolled
                })

                onScrollRef.current?.()
            })
        }

        if (window.scrollY > scrollOpenThreshold) {
            setIsScrolled(true)
        }

        window.addEventListener("scroll", handleScroll)

        return () => {
            if (frame) {
                window.cancelAnimationFrame(frame)
            }

            window.removeEventListener("scroll", handleScroll)
        }
    }, [])

    return isScrolled
}
