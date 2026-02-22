"use client"

import { Section } from "@/components/ui/Section"
import React from "react"

interface UseCaseItem {
    label: string
    title: string
    description: string
    id?: string | null
}

interface UseCaseSectionContent {
    useCases: UseCaseItem[] | null
}

interface UseCaseSectionProps {
    content?: UseCaseSectionContent | null
}

export const UseCaseSection: React.FC<UseCaseSectionProps> = ({ content }) => {
    if (!content?.useCases?.length) return null

    return (
        <Section sectionType="UseCaseSection">
            <div className="relative w-full flex flex-col items-stretch gap-32">
                {content.useCases.map((item, index) => (
                    <div
                        key={item.id ?? item.label}
                        className={`w-full flex flex-col items-center gap-8 ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                    >
                        <div className="w-1/2 hidden md:block mt-4 px-2 pb-2 text-center md:text-left">
                            <p className="text-xl md:text-2xl font-semibold text-white">{item.title}</p>
                            <p className="mt-2 text-sm md:text-base text-white/75">{item.description}</p>
                        </div>
                        <div className="relative h-112 w-2/3 rounded-2xl overflow-hidden bg-primary border border-white/10 shadow-md">
                            {/* Flows darstellen */}
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    )
}
