import { Section } from "@/components/ui/Section"
import { getRoadmapItems } from "@/lib/cms"
import { AppLocale } from "@/lib/i18n"
import React from "react"
import { RoadmapRevealItem } from "../RoadmapRevealItem"

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
                    {items.map((item, index) => {
                        const isEven = index % 2 === 0

                        return (
                            <RoadmapRevealItem
                                key={item.id}
                                delay={index * 0.1}
                            >
                                <div id={`roadmap-item-${item.id}`} className="relative">
                                    <div className="absolute left-3 top-6 h-6 w-6 -translate-x-1/2 rounded-full border border-brand/18 bg-brand/12 blur-md md:left-1/2" />
                                    <div className="absolute left-3 top-6 h-3 w-3 -translate-x-1/2 rounded-full border border-brand/70 bg-brand shadow-[0_0_18px_rgba(134,255,190,0.55)] md:left-1/2" />

                                    <div className={`grid grid-cols-1 md:grid-cols-2 md:gap-10 ${isEven ? "" : "md:[&>*:first-child]:order-2 md:[&>*:last-child]:order-1"}`}>
                                        <div className="hidden md:block" />

                                        <div className="relative ml-8 md:ml-0">
                                            <div className="pointer-events-none absolute -inset-8 rounded-4xl bg-blue/2 blur-lg" />
                                            <div className="relative z-10 isolate overflow-hidden rounded-3xl border border-white/8 bg-[linear-gradient(180deg,rgba(16,18,34,0.88),rgba(12,14,28,0.78))] p-6 shadow-[0_16px_42px_rgba(0,0,0,0.22)] transition-transform duration-300 ease-in-out before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-white/22 before:to-transparent before:content-['']">
                                                <div className="mb-4 flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-white/42">
                                                    <span className="inline-flex rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-brand">
                                                        {item.time}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-semibold tracking-tight text-white md:text-2xl">{item.title}</h3>
                                                <p className="mt-3 text-sm leading-7 text-white/75 md:text-[0.95rem]">{item.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </RoadmapRevealItem>
                        )
                    })}
                </div>
            </div>
        </Section>
    )
}
