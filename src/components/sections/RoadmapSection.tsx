import { Section } from "@/components/ui/Section"
import { getRoadmapItems } from "@/lib/cms"
import { AppLocale } from "@/lib/i18n"
import React from "react"

interface RoadmapSectionProps {
    locale: AppLocale
}

export const RoadmapSection: React.FC<RoadmapSectionProps> = async ({ locale }) => {
    const items = await getRoadmapItems(locale)
    if (!items?.length) return null

    return (
        <Section sectionType="RoadmapSection" funnelType="left" animationPreset="zoom-in">
            <div className="relative w-full py-8 md:py-16">
                <div className="pointer-events-none absolute left-3 top-0 h-full w-0.5 rounded-full bg-white/15 md:left-1/2 md:-translate-x-1/2" />

                <div className="flex flex-col gap-10 md:gap-14">
                    {items.map((item, index) => {
                        const isEven = index % 2 === 0

                        return (
                            <article key={item.id} id={`roadmap-item-${item.id}`} className="relative">
                                <div className="absolute left-3 top-6 h-3 w-3 -translate-x-1/2 rounded-full border border-brand/60 bg-brand md:left-1/2" />

                                <div className={`grid grid-cols-1 md:grid-cols-2 md:gap-10 ${isEven ? "" : "md:[&>*:first-child]:order-2 md:[&>*:last-child]:order-1"}`}>
                                    <div className="hidden md:block" />

                                    <div className="relative ml-8 md:ml-0">
                                        <div className="pointer-events-none absolute -inset-8 rounded-4xl bg-blue/8 blur-3xl" />
                                        <div className="relative z-10 rounded-2xl border border-white/10 bg-linear-to-br from-primary to-blue/2 p-5 backdrop-blur-md">
                                            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-white/60">{item.time}</p>
                                            <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                                            <p className="mt-3 text-sm leading-relaxed text-white/75">{item.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        )
                    })}
                </div>
            </div>
        </Section>
    )
}
