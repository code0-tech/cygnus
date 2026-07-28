"use client"

import { ContactForm } from "@/components/forms/ContactForm"
import { useDesktopPinnedPosition } from "@/hooks/useDesktopPinnedPosition"
import type { ContactLayoutBlock } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"

interface ContactSectionProps {
    locale: AppLocale
    content?: ContactLayoutBlock | null
}

export function ContactSection({ locale, content }: ContactSectionProps) {
    const desktopTopOffset = 128
    const pageHeading = content?.heading ?? "Contact us"
    const pageDescription = content?.description ?? "Contact us if you want to know more about CodeZero."

    const { wrapperRef: desktopWrapperRef, containerRef: desktopContainerRef } = useDesktopPinnedPosition<HTMLElement, HTMLDivElement>(desktopTopOffset)

    return (
        <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-2">
            <section className="min-w-0">
                <h1 className="text-4xl font-semibold text-white">{pageHeading}</h1>
                <p className="mt-4 text-secondary">{pageDescription}</p>
            </section>

            <section ref={desktopWrapperRef} className="relative min-w-0">
                <div ref={desktopContainerRef} className="relative z-10">
                    <ContactForm content={content} locale={locale} />
                </div>
            </section>
        </div>
    )
}
