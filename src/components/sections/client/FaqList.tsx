"use client"

import { AccordionItem } from "@/components/ui/Accordion"
import { m as motion } from "motion/react"
import { useCallback, useState } from "react"
import { useWebHaptics } from "web-haptics/react"

interface FaqListProps {
    items: {
        question: string
        answer: string
    }[]
}

export function FaqList({ items }: FaqListProps) {
    const [openItem, setOpenItem] = useState<number | null>(null)
    const { trigger } = useWebHaptics()

    const toggleItem = useCallback(
        (index: number) => {
            trigger("soft")
            setOpenItem((prevOpenItem) => (prevOpenItem === index ? null : index))
        },
        [trigger]
    )

    return (
        <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-4">
            {items.map((faq, index) => (
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
    )
}
