"use client"

import { MarkdownContent } from "@/components/blog/MarkdownContent"
import { JobApplicationForm } from "@/components/forms/JobApplicationForm"
import type { JobsLayoutBlock } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { useDesktopPinnedPosition } from "@/hooks/useDesktopPinnedPosition"

interface JobDetailContentProps {
    contentHtml: string
    jobSlug: string
    locale: AppLocale
    jobsBlock: JobsLayoutBlock | null
}

export function JobDetailContent({ contentHtml, jobSlug, locale, jobsBlock }: JobDetailContentProps) {
    const desktopTopOffset = 128
    const { wrapperRef: desktopWrapperRef, containerRef: desktopContainerRef } = useDesktopPinnedPosition<HTMLElement, HTMLDivElement>(desktopTopOffset)

    return (
        <div className="grid gap-8 lg:grid-cols-5">
            <section className="min-w-0 lg:col-span-3">
                <MarkdownContent content={contentHtml} />
            </section>

            <section ref={desktopWrapperRef} className="relative min-w-0 lg:col-span-2">
                <div
                    ref={desktopContainerRef}
                    className="relative z-10"
                >
                    <JobApplicationForm jobSlug={jobSlug} content={jobsBlock} locale={locale} />
                </div>
            </section>
        </div>
    )
}
