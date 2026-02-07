"use client"

import { AccordionItem } from "@/components/Accordion"
import { Section } from "@/components/Section"
import { useTranslations } from "next-intl"
import React, { useState } from "react"

export const FaqSection: React.FC = () => {
    const t = useTranslations("FaqSection")
    const faqs = t.raw("faqs") as { question: string, answer: string }[];

    const [openItems, setOpenItems] = useState<Set<number>>(new Set())

    const toggleItem = (index: number) => {
        const newOpenItems = new Set(openItems)

        if (newOpenItems.has(index)) newOpenItems.delete(index)
        else newOpenItems.add(index)

        setOpenItems(newOpenItems)
    }

    return (
        <Section translationKey="FaqSection">
            <div className={"flex flex-col gap-4 z-10"}>
                {faqs.map((faq, index) => (
                    <AccordionItem key={index} {...faq} isOpen={openItems.has(index)} onToggle={() => toggleItem(index)} />
                ))}
            </div>
        </Section>
    )
}
