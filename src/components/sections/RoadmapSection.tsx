import { Section } from "@/components/ui/Section"
import { getRoadmapItems } from "@/lib/cms"
import { AppLocale } from "@/lib/i18n"
import React from "react"
import { RoadmapItemCard } from "../cards/RoadmapItemCard"
import { RoadmapRevealItem } from "../RoadmapRevealItem"
import { cn } from "@/lib/utils"

interface RoadmapSectionProps {
    locale: AppLocale
}

export const RoadmapSection: React.FC<RoadmapSectionProps> = async ({ locale }) => {
    const items = await getRoadmapItems(locale)
    if (!items?.length) return null

    return (
        <Section sectionType="RoadmapSection" funnelType="left" animationPreset="zoom-in">
            <div className="relative w-full py-8 md:py-16">
                <div className="pointer-events-none absolute left-3 top-0 h-full w-0.5 rounded-full bg-linear-to-b from-brand/10 via-white/20 to-blue/10 md:left-1/2 md:-translate-x-1/2" />
                <div className="pointer-events-none absolute left-3 top-0 h-full w-10 -translate-x-1/2 bg-[radial-gradient(circle,rgba(122,203,255,0.08),transparent_70%)] blur-2xl md:left-1/2" />

                <div className="flex flex-col gap-10 md:gap-14">
                    {items.map((item, index) => (
                        <RoadmapRevealItem
                            key={item.id}
                            delay={index * 0.1}
                        >
                            <div id={`roadmap-item-${item.id}`} className="relative">
                                <div className="absolute left-3 top-6 h-3 w-3 -translate-x-1/2 rounded-full border border-brand/70 bg-brand shadow-[0_0_18px_rgba(134,255,190,0.55)] md:left-1/2" />

                                <div className={cn("grid grid-cols-1 md:grid-cols-2 md:gap-10", index % 2 === 0 && "md:[&>*:first-child]:order-2 md:[&>*:last-child]:order-1")}>
                                    <div className="hidden md:block" />

                                    <div className="relative ml-8 md:ml-0">
                                        <div className="pointer-events-none absolute -inset-8 rounded-4xl bg-blue/2 blur-lg" />
                                        <RoadmapItemCard
                                            time={item.time}
                                            title={item.title}
                                            description={item.description}
                                        />
                                    </div>
                                </div>
                            </div>
                        </RoadmapRevealItem>
                    ))}
                </div>
            </div>
        </Section>
    )
}
