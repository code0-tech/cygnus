"use client"

import { MarkdownContent } from "@/components/blog/MarkdownContent"
import { JobApplicationForm } from "@/components/forms/JobApplicationForm"
import type { JobsLayoutBlock } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"

interface JobDetailContentProps {
    contentHtml: string
    jobSlug: string
    locale: AppLocale
    jobsBlock: JobsLayoutBlock | null
}

export function JobDetailContent({ contentHtml, jobSlug, locale, jobsBlock }: JobDetailContentProps) {
    const desktopTopOffset = 96
    const [desktopMode, setDesktopMode] = useState<"static" | "fixed" | "bottom">("static")
    const [desktopStyle, setDesktopStyle] = useState<{ left: number, width: number, top: number } | null>(null)
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

            const nextMode =
                fixedTop <= wrapperTop
                    ? "static"
                    : fixedTop >= wrapperTop + maxTop
                        ? "bottom"
                        : "fixed"

            setDesktopMode((prev) => (prev === nextMode ? prev : nextMode))
            setDesktopStyle((prev) => (
                prev?.left === wrapperRect.left && prev?.width === wrapperRect.width && prev?.top === maxTop
                    ? prev
                    : { left: wrapperRect.left, width: wrapperRect.width, top: maxTop }
            ))
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
        <div className="grid gap-8 lg:grid-cols-5">
            <section className="min-w-0 lg:col-span-3">
                <MarkdownContent content={contentHtml} />
            </section>

            <section ref={desktopWrapperRef} className="relative min-w-0 lg:col-span-2">
                <div
                    ref={desktopContainerRef}
                    className={cn(
                        "relative z-10",
                        desktopMode === "fixed" && "fixed z-30",
                        desktopMode === "bottom" && "absolute left-0 right-0",
                    )}
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
                    <JobApplicationForm jobSlug={jobSlug} content={jobsBlock} locale={locale} />
                </div>
            </section>
        </div>
    )
}
