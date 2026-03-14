"use client"

import { AccordionItem } from "@/components/ui/Accordion"
import { Section } from "@/components/ui/Section"
import { motion } from "motion/react"
import React, { useCallback, useState } from "react"
import { useWebHaptics } from "web-haptics/react"

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
    const { trigger } =useWebHaptics()

    const toggleItem = useCallback((index: number) => {
        trigger("soft")
        setOpenItems((prevOpenItems) => {
            const nextOpenItems = new Set(prevOpenItems)

            if (nextOpenItems.has(index)) nextOpenItems.delete(index)
            else nextOpenItems.add(index)

            return nextOpenItems
        })
    }, [trigger])

    if (!content || !content.items) return

    return (
        <Section sectionType="FaqSection" showLinkButton={false} showBlur={false}>
            <div className={"h-[60vh] md:w-[50vw] flex flex-col gap-4 mx-auto"}>
                <div className="pointer-events-none absolute inset-0 opacity-10 blur-xs [background:radial-gradient(circle,rgba(255,255,255,0.5),transparent_50%)]" />
                {content.items.map((faq, index) => (
                    <motion.div
                        key={`${faq.question}-${index}`}
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{
                            duration: 0.38,
                            delay: index * 0.08,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                    >
                        <AccordionItem
                            index={index}
                            {...faq}
                            isOpen={openItems.has(index)}
                            onToggle={toggleItem}
                        />
                    </motion.div>
                ))}
            </div>
        </Section>
    )
}
