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
            <div aria-hidden="true" className="pointer-events-none absolute left-3 top-0 h-full w-0.5 rounded-full bg-linear-to-b from-brand/10 via-white/20 to-blue/10 md:left-1/2 md:-translate-x-1/2" />
                <div className="flex flex-col gap-10 md:gap-14">
                    {items.map((item, index) => (
                        <RoadmapRevealItem
                            key={item.id}
                            delay={index * 0.1}
                        >
                            <div id={`roadmap-item-${item.id}`} className="relative">
                                <div aria-hidden="true" className="absolute left-3 top-6 h-3 w-3 -translate-x-1/2 rounded-full border border-brand/70 bg-brand md:left-1/2" />

                                <div className={cn("grid grid-cols-1 md:grid-cols-2 md:gap-10", index % 2 === 0 && "md:[&>*:first-child]:order-2 md:[&>*:last-child]:order-1")}>
                                    <div aria-hidden="true" className="hidden md:block" />
                                    <RoadmapItemCard
                                        time={item.time}
                                        title={item.title}
                                        description={item.description}
                                    />
                                </div>
                            </div>
                        </RoadmapRevealItem>
                    ))}
                </div>
            </div>
        </Section>
    )
}
