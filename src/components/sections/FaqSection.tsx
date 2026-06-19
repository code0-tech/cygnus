"use client"

import { AccordionItem } from "@/components/ui/Accordion"
import { Section } from "@/components/ui/Section"
import { FaqLayoutBlock } from "@/lib/cms"
import { m as motion } from "motion/react"
import React, { useCallback, useState } from "react"
import { useWebHaptics } from "web-haptics/react"

interface FaqSectionProps {
    content?: FaqLayoutBlock | null
}

export function FaqSection({ content }: FaqSectionProps) {
    const [openItem, setOpenItem] = useState<number | null>(null)
    const { trigger } = useWebHaptics()

    const toggleItem = useCallback(
        (index: number) => {
            trigger("soft")
            setOpenItem((prevOpenItem) => (prevOpenItem === index ? null : index))
        },
        [trigger]
    )

    if (!content || !content.items) return

    return (
        <Section
            heading={content.sectionHeading}
            description={content.sectionDescription}
            linkButton={content.sectionLinkButton}
            funnelType={content.sectionLayout ?? "center"}
            showLinkButton={false}
            showBlur={false}
        >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0" />
            <div className={"md:w-[50vw] flex flex-col gap-4 mx-auto"}>
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
                        <AccordionItem index={index} isOpen={openItem === index} onToggle={toggleItem} {...faq} />
                    </motion.div>
                ))}
            </div>
        </Section>
    )
}
