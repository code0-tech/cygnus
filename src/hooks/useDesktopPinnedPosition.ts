"use client"

import { useLayoutEffect, useRef } from "react"

type PinMode = "static" | "fixed" | "bottom"
type VerticalAlign = "top" | "center"

export function useDesktopPinnedPosition<TWrapper extends HTMLElement, TContainer extends HTMLElement>(topOffset: number, verticalAlign: VerticalAlign = "top") {
    const wrapperRef = useRef<TWrapper>(null)
    const containerRef = useRef<TContainer>(null)
    const layoutKeyRef = useRef("")

    useLayoutEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 1023px)")
        let frame = 0

        const applyPosition = (mode: PinMode, left = 0, width = 0, top = 0, fixedTopValue = topOffset) => {
            const container = containerRef.current
            if (!container) return

            const layoutKey = `${mode}:${left}:${width}:${top}:${fixedTopValue}`

            if (layoutKeyRef.current !== layoutKey) {
                layoutKeyRef.current = layoutKey

                container.style.position = mode === "fixed" ? "fixed" : mode === "bottom" ? "absolute" : "relative"

                container.style.zIndex = mode === "fixed" ? "30" : ""

                container.style.left = mode === "fixed" ? `${left}px` : mode === "bottom" ? "0" : ""

                container.style.right = mode === "fixed" ? "auto" : mode === "bottom" ? "0" : ""

                container.style.top = mode === "fixed" ? `${fixedTopValue}px` : mode === "bottom" ? `${top}px` : ""

                container.style.width = mode === "fixed" ? `${width}px` : ""
            }

            // Erst anzeigen, nachdem die korrekte Position gesetzt wurde
            container.style.visibility = "visible"
        }

        const updatePosition = () => {
            frame = 0

            if (mediaQuery.matches) {
                applyPosition("static")
                return
            }

            const wrapper = wrapperRef.current
            const container = containerRef.current

            if (!wrapper || !container) return

            const wrapperRect = wrapper.getBoundingClientRect()

            const maxTop = Math.max(wrapper.offsetHeight - container.offsetHeight, 0)

            const wrapperTop = window.scrollY + wrapperRect.top

            const fixedTopValue = verticalAlign === "center" ? Math.max(topOffset, (window.innerHeight - container.offsetHeight) / 2) : topOffset

            const fixedTop = window.scrollY + fixedTopValue

            const mode: PinMode = fixedTop <= wrapperTop ? "static" : fixedTop >= wrapperTop + maxTop ? "bottom" : "fixed"

            applyPosition(mode, wrapperRect.left, wrapperRect.width, maxTop, fixedTopValue)
        }

        const scheduleUpdate = () => {
            if (frame) return

            frame = window.requestAnimationFrame(updatePosition)
        }

        updatePosition()

        const resizeObserver = new ResizeObserver(scheduleUpdate)

        if (wrapperRef.current) {
            resizeObserver.observe(wrapperRef.current)
        }

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current)
        }

        window.addEventListener("scroll", scheduleUpdate, { passive: true })
        window.addEventListener("resize", scheduleUpdate)
        mediaQuery.addEventListener("change", scheduleUpdate)

        return () => {
            if (frame) {
                window.cancelAnimationFrame(frame)
            }

            resizeObserver.disconnect()

            window.removeEventListener("scroll", scheduleUpdate)
            window.removeEventListener("resize", scheduleUpdate)
            mediaQuery.removeEventListener("change", scheduleUpdate)
        }
    }, [topOffset, verticalAlign])

    return {
        wrapperRef,
        containerRef,
    }
}
