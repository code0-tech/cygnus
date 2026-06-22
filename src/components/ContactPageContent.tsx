"use client"

import { ContactForm } from "@/components/forms/ContactForm"
import type { ContactLayoutBlock } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"

interface ContactPageContentProps {
    locale: AppLocale
    contactBlock: ContactLayoutBlock | null
}

export function ContactPageContent({ locale, contactBlock }: ContactPageContentProps) {
    const desktopTopOffset = 128
    const pageHeading = contactBlock?.heading ?? "Contact us"
    const pageDescription = contactBlock?.description ?? "Contact us if you want to know more about CodeZero."

    const [desktopMode, setDesktopMode] = useState<"static" | "fixed" | "bottom">("static")
    const [desktopStyle, setDesktopStyle] = useState<{ left: number; width: number; top: number } | null>(null)

    const desktopWrapperRef = useRef<HTMLElement>(null)
    const desktopContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 1023px)")

        const updateDesktopPosition = () => {
            if (mediaQuery.matches) {
                setDesktopMode("static")
                setDesktopStyle(null)
                return
            }

            const wrapper = desktopWrapperRef.current
            const container = desktopContainerRef.current
            if (!wrapper || !container) return

            const wrapperRect = wrapper.getBoundingClientRect()
            const containerHeight = container.offsetHeight
            const wrapperHeight = wrapper.offsetHeight
            const maxTop = Math.max(wrapperHeight - containerHeight, 0)
            const wrapperTop = window.scrollY + wrapperRect.top
            const fixedTop = window.scrollY + desktopTopOffset

            const nextMode = fixedTop <= wrapperTop ? "static" : fixedTop >= wrapperTop + maxTop ? "bottom" : "fixed"

            setDesktopMode((prev) => (prev === nextMode ? prev : nextMode))
            setDesktopStyle((prev) =>
                prev?.left === wrapperRect.left && prev?.width === wrapperRect.width && prev?.top === maxTop ? prev : { left: wrapperRect.left, width: wrapperRect.width, top: maxTop }
            )
        }

        updateDesktopPosition()

        const resizeObserver = new ResizeObserver(updateDesktopPosition)
        const wrapper = desktopWrapperRef.current
        const container = desktopContainerRef.current
        if (wrapper) resizeObserver.observe(wrapper)
        if (container) resizeObserver.observe(container)

        window.addEventListener("scroll", updateDesktopPosition, { passive: true })
        window.addEventListener("resize", updateDesktopPosition)
        mediaQuery.addEventListener("change", updateDesktopPosition)

        return () => {
            resizeObserver.disconnect()
            window.removeEventListener("scroll", updateDesktopPosition)
            window.removeEventListener("resize", updateDesktopPosition)
            mediaQuery.removeEventListener("change", updateDesktopPosition)
        }
    }, [])

    return (
        <div className="grid gap-8 lg:grid-cols-2">
            <section className="min-w-0">
                <h1 className="text-4xl font-semibold text-white">{pageHeading}</h1>
                <p className="mt-4 text-white/75">{pageDescription}</p>
            </section>

            <section ref={desktopWrapperRef} className="relative min-w-0">
                <div
                    ref={desktopContainerRef}
                    className={cn("relative z-10", desktopMode === "fixed" && "fixed z-30", desktopMode === "bottom" && "absolute left-0 right-0")}
                    style={
                        desktopMode === "fixed" && desktopStyle
                            ? {
                                  top: `${desktopTopOffset}px`,
                                  left: `${desktopStyle.left}px`,
                                  width: `${desktopStyle.width}px`,
                              }
                            : desktopMode === "bottom" && desktopStyle
                              ? { top: `${desktopStyle.top}px` }
                              : undefined
                    }
                >
                    <ContactForm content={contactBlock} locale={locale} />
                </div>
            </section>
        </div>
    )
}
