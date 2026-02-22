"use client"

import { AccordionItem } from "@/components/ui/Accordion"
import { Section } from "@/components/ui/Section"
import React, { useState } from "react"

interface FaqItem {
    question: string
    answer: string
    id?: string | null
}

interface FaqSectionContent {
    items: FaqItem[] | null
}

interface FaqSectionProps {
    content?: FaqSectionContent | null
}

export const FaqSection: React.FC<FaqSectionProps> = ({ content }) => {
    const [openItems, setOpenItems] = useState<Set<number>>(new Set())

    const toggleItem = (index: number) => {
        const newOpenItems = new Set(openItems)

        if (newOpenItems.has(index)) newOpenItems.delete(index)
        else newOpenItems.add(index)

        setOpenItems(newOpenItems)
    }

    if (!content || !content.items) return

    return (
        <Section sectionType="FaqSection" showLinkButton={false}>
            <div className={"h-[60vh] md:w-[50vw] flex flex-col gap-4 mx-auto"}>
                {content.items.map((faq, index) => (
                    <AccordionItem
                        key={`${faq.question}-${index}`} {...faq}
                        isOpen={openItems.has(index)}
                        onToggle={() => toggleItem(index)}
                    />
                ))}
            </div>
        </Section>
    )
}
