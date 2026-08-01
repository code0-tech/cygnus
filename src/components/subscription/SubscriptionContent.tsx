"use client"

import { useDesktopPinnedPosition } from "@/hooks/useDesktopPinnedPosition"
import type { SubscriptionConfiguratorContent } from "@/lib/cms"

interface SubscriptionContentProps {
    content: SubscriptionConfiguratorContent
}

export function SubscriptionContent({ content }: SubscriptionContentProps) {
    const { wrapperRef, containerRef } = useDesktopPinnedPosition<HTMLElement, HTMLDivElement>(96)

    return (
        <section ref={wrapperRef} className="relative min-w-0 lg:col-span-3">
            <div ref={containerRef} className="relative z-10 flex min-w-0 flex-col gap-12">
                <div className="max-w-2xl">
                    <h1 className="mt-4 max-w-xl text-balance text-3xl font-semibold text-white lg:text-4xl">{content.pageIntro.heading}</h1>
                    <p className="mt-4 max-w-xl text-base leading-7 text-secondary lg:text-lg">{content.pageIntro.description}</p>
                </div>
            </div>
        </section>
    )
}
