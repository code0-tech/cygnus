"use client"

import { cn } from "@/lib/utils"
import { useEffect, useRef, type ReactNode } from "react"

interface FloatingCtaDockProps {
    children: ReactNode
    floating?: boolean
    className?: string
}

export function FloatingCtaDock({ children, floating = false, className }: FloatingCtaDockProps) {
    const anchorRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!floating) return

        const anchor = anchorRef.current
        const button = buttonRef.current
        if (!anchor || !button) return

        const floatingBottomOffset = 24
        let intersectionObserver: IntersectionObserver | null = null

        const observeAnchor = () => {
            intersectionObserver?.disconnect()
            const buttonHeight = button.getBoundingClientRect().height
            const bottomMargin = floatingBottomOffset + buttonHeight

            intersectionObserver = new IntersectionObserver(
                ([entry]) => {
                    if (!entry) return

                    const nextDocked = entry.isIntersecting || entry.boundingClientRect.top < 0
                    button.dataset.docked = String(nextDocked)
                },
                {
                    rootMargin: `0px 0px -${bottomMargin}px 0px`,
                    threshold: 0,
                }
            )
            intersectionObserver.observe(anchor)
        }

        observeAnchor()
        const resizeObserver = new ResizeObserver(observeAnchor)
        resizeObserver.observe(button)

        return () => {
            intersectionObserver?.disconnect()
            resizeObserver.disconnect()
        }
    }, [floating])

    return (
        <div ref={anchorRef} className={cn("z-20 mt-4 flex h-10 items-center justify-center", className)}>
            <div
                ref={buttonRef}
                data-docked={floating ? "false" : undefined}
                className={cn("flex items-center gap-4", floating && "group/floating-cta data-[docked=false]:fixed data-[docked=false]:bottom-6 data-[docked=false]:left-1/2 data-[docked=false]:z-50 data-[docked=false]:-translate-x-1/2")}
            >
                {children}
            </div>
        </div>
    )
}
