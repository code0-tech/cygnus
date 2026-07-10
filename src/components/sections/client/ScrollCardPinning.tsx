"use client"

import { useEffect, useRef, type ReactNode } from "react"

interface ScrollCardPinningProps {
    children: ReactNode
    itemCount: number
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

export function ScrollCardPinning({ children, itemCount }: ScrollCardPinningProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const pinnedRef = useRef<HTMLDivElement | null>(null)
    const pinStyleRef = useRef({ phase: "before", left: 0, width: 0 })

    useEffect(() => {
        let frame = 0

        const updateProgress = () => {
            const container = containerRef.current
            const pinned = pinnedRef.current
            if (!container || !pinned) return

            const articles = Array.from(pinned.querySelectorAll<HTMLElement>("[data-scroll-card-article]"))
            const rect = container.getBoundingClientRect()
            const topOffset = 96
            const height = window.innerHeight
            const bottomOffset = topOffset
            const availableHeight = Math.max(height - topOffset - bottomOffset, 0)
            const cardWidth = Math.min(rect.width, availableHeight * (16 / 9))
            const containerTop = rect.top + window.scrollY
            const rawProgress = window.scrollY - containerTop + topOffset
            const activeEnd = Math.max((itemCount - 1) * height, 0)
            const scrollProgress = clamp(rawProgress, 0, activeEnd)
            const cardTravelDistance = Math.max(height - topOffset, 0)
            const phase = rect.top > topOffset ? "before" : rect.bottom <= height - topOffset ? "after" : "active"
            const previousPinStyle = pinStyleRef.current

            container.style.setProperty("--scroll-card-width", `${cardWidth}px`)
            pinned.style.height = `${availableHeight}px`

            if (phase !== previousPinStyle.phase || rect.left !== previousPinStyle.left || rect.width !== previousPinStyle.width) {
                pinStyleRef.current = { phase, left: rect.left, width: rect.width }
                pinned.style.position = phase === "active" ? "fixed" : phase === "after" ? "absolute" : "relative"
                pinned.style.left = phase === "active" ? `${rect.left}px` : ""
                pinned.style.right = phase === "active" ? "auto" : ""
                pinned.style.top = phase === "active" ? `${topOffset}px` : ""
                pinned.style.bottom = phase === "after" ? "0" : ""
                pinned.style.width = phase === "active" ? `${rect.width}px` : "100%"
                pinned.style.overflow = phase === "before" ? "hidden" : "visible"
            }

            articles.forEach((article, index) => {
                const segmentProgress = index === 0 ? 1 : clamp((scrollProgress - (index - 1) * height) / height, 0, 1)
                article.style.transform = `translate3d(0, ${(1 - segmentProgress) * cardTravelDistance}px, 0)`
            })
        }

        const handleViewportChange = () => {
            if (frame) return
            frame = window.requestAnimationFrame(() => {
                frame = 0
                updateProgress()
            })
        }

        updateProgress()
        window.addEventListener("scroll", handleViewportChange, { passive: true })
        window.addEventListener("resize", handleViewportChange)

        return () => {
            if (frame) window.cancelAnimationFrame(frame)
            window.removeEventListener("scroll", handleViewportChange)
            window.removeEventListener("resize", handleViewportChange)
        }
    }, [itemCount])

    return (
        <div ref={containerRef} className="relative" style={{ height: `${Math.max(itemCount, 1) * 100}vh` }}>
            <div ref={pinnedRef} className="relative z-10 h-[calc(100dvh-12rem)] w-full overflow-hidden">
                {children}
            </div>
        </div>
    )
}
