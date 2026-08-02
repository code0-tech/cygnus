"use client"

import type { SubscriptionOptionImageKey } from "@/components/subscription/SubscriptionConfigurator"
import { useDesktopPinnedPosition } from "@/hooks/useDesktopPinnedPosition"
import type { SubscriptionConfiguratorContent } from "@/lib/cms"
import { getMediaUrl } from "@/lib/media"
import type { Media } from "@/payload-types"
import { AnimatePresence, m as motion } from "motion/react"
import Image from "next/image"

interface SubscriptionContentProps {
    activeImageKey: SubscriptionOptionImageKey
    content: SubscriptionConfiguratorContent
}

export function SubscriptionContent({ activeImageKey, content }: SubscriptionContentProps) {
    const { wrapperRef, containerRef } = useDesktopPinnedPosition<HTMLElement, HTMLDivElement>(96, "center")
    const options = {
        b2b: content.customerType.b2b,
        b2c: content.customerType.b2c,
        pro: content.plan.pro,
        max: content.plan.max,
        custom: content.plan.custom,
        selfHosted: content.deployment.selfHosted,
        cloud: content.deployment.cloud,
    }
    const activeOption = options[activeImageKey]
    const media = activeOption.image && typeof activeOption.image === "object" ? (activeOption.image as Media) : null
    const imageUrl = getMediaUrl(media?.url)

    return (
        <section ref={wrapperRef} className="relative min-w-0 lg:col-span-3">
            <div ref={containerRef} className="relative z-10 flex min-w-0 flex-col gap-4">
                <div className="max-w-2xl">
                    <h1 className="text-balance text-xl font-semibold text-white lg:text-2xl">{content.pageIntro.heading}</h1>
                    <p className="text-base leading-7 text-secondary lg:text-lg">{content.pageIntro.description}</p>
                </div>

                <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-white/10 bg-white/3">
                    <AnimatePresence initial={false} mode="wait">
                        <motion.div
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0"
                            exit={{ opacity: 0, scale: 0.99 }}
                            initial={{ opacity: 0, scale: 1.01 }}
                            key={activeImageKey}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                        >
                            {imageUrl ? (
                                <Image src={imageUrl} alt={media?.alt || activeOption.title} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
                            ) : (
                                <div aria-hidden="true" className="h-full w-full" />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    )
}
