"use client"

import { ContactForm } from "@/components/forms/ContactForm"
import type { ContactLayoutBlock } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { useDesktopPinnedPosition } from "@/hooks/useDesktopPinnedPosition"

interface ContactPageContentProps {
    locale: AppLocale
    contactBlock: ContactLayoutBlock | null
}

export function ContactPageContent({ locale, contactBlock }: ContactPageContentProps) {
    const desktopTopOffset = 128
    const pageHeading = contactBlock?.heading ?? "Contact us"
    const pageDescription = contactBlock?.description ?? "Contact us if you want to know more about CodeZero."

    const { wrapperRef: desktopWrapperRef, containerRef: desktopContainerRef } = useDesktopPinnedPosition<HTMLElement, HTMLDivElement>(desktopTopOffset)

    return (
        <div className="grid gap-8 lg:grid-cols-2">
            <section className="min-w-0">
                <h1 className="text-4xl font-semibold text-white">{pageHeading}</h1>
                <p className="mt-4 text-secondary">{pageDescription}</p>
            </section>

            <section ref={desktopWrapperRef} className="relative min-w-0">
                <div
                    ref={desktopContainerRef}
                    className="relative z-10"
                >
                    <ContactForm content={contactBlock} locale={locale} />
                </div>
            </section>
        </div>
    )
}
