import { Section } from "@/components/ui/Section"
import React from "react"
import { RoadmapItemCard } from "../cards/RoadmapItemCard"
import { cn } from "@/lib/utils"
import { RoadmapLayoutBlock } from "@/lib/cms"

interface RoadmapSectionProps {
    content?: RoadmapLayoutBlock | null
}

export function RoadmapSection({ content }: RoadmapSectionProps) {
    const items = content?.items ?? []
    if (!items?.length) return null

    return (
        <Section
            heading={content?.sectionHeading}
            description={content?.sectionDescription}
            linkButton={content?.sectionLinkButton}
            funnelType={content?.sectionLayout ?? "center"}
            animationPreset="zoom-in"
        >
            <div className="relative w-full py-8 md:py-16">
            <div aria-hidden="true" className="pointer-events-none absolute left-3 top-0 h-full w-0.5 rounded-full bg-linear-to-b from-brand/10 via-white/20 to-blue/10 md:left-1/2 md:-translate-x-1/2" />
                <div className="flex flex-col gap-10 md:gap-14">
                    {items.map((item, index) => (
                        <div key={item.id ?? `roadmap-item-${index}`} className="relative">
                            <div aria-hidden="true" className="absolute left-3 top-6 h-3 w-3 -translate-x-1/2 rounded-full border border-brand/70 bg-brand md:left-1/2" />
                            <div className={cn("grid grid-cols-1 md:grid-cols-2 md:gap-12", index % 2 === 0 && "md:[&>*:first-child]:order-2 md:[&>*:last-child]:order-1")}>
                                <div aria-hidden="true" className="hidden md:block" />
                                <RoadmapItemCard
                                    time={item.time}
                                    title={item.title}
                                    description={item.description}
                                    className={cn(
                                        "md:w-[90%]",
                                        index % 2 === 0 ? "md:mr-0 md:ml-auto" : "md:ml-0 md:mr-auto",
                                    )}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Section>
    )
}
