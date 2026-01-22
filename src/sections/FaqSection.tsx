"use client"

import React, {useState} from "react"
import {AccordionItem} from "@/components/Accordion"
import {useTranslations} from "next-intl"

export const FaqSection: React.FC = () => {
    const t = useTranslations("FaqSection")
    const faqs = t.raw("faqs") as { question: string; answer: string }[];

    const [openItems, setOpenItems] = useState<Set<number>>(new Set())

    const toggleItem = (index: number) => {
        const newOpenItems = new Set(openItems)

        if (newOpenItems.has(index)) newOpenItems.delete(index)
        else newOpenItems.add(index)

        setOpenItems(newOpenItems)
    }

    return (
        <div className={"relative overflow-hidden flex flex-col gap-8 items-center justify-center py-40 px-[10%] md:px-[24%]"}>

            <div
                className="
                    pointer-events-none
                    absolute -inset-16 z-0
                    opacity-10 blur-lg
                    will-change-filter
                    [background:radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_45%)]
                "
            />

            <p className={"text-2xl lg:text-4xl text-white font-semibold text-center"}>
                {t("title")}
            </p>
            <div className={"flex flex-col gap-4 z-10"}>
                {faqs.map((faq, index) => (
                    <AccordionItem key={index} {...faq} isOpen={openItems.has(index)} onToggle={() => toggleItem(index)} />
                ))}
            </div>
        </div>
    )
}
