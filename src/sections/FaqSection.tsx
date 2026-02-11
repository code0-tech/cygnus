"use client"

import { AccordionItem } from "@/components/Accordion"
import { Section } from "@/components/Section"
import React, { useState } from "react"

export const FaqSection: React.FC = () => {
    const faqs = [
      {
        "question": "Wie funktioniert CodeZero?",
        "answer": "CodeZero ermöglicht es dir, Backend-Logik über eine visuelle Oberfläche zu erstellen – ganz ohne Programmierung."
      },
      {
        "question": "Kann ich mein Projekt überall deployen?",
        "answer": "Ja, CodeZero-Projekte können in verschiedenen Umgebungen, einschließlich Cloud-Anbietern, bereitgestellt werden."
      },
      {
        "question": "Gibt es eine kostenlose Version?",
        "answer": "Ja, wir bieten einen kostenlosen Plan, um die wichtigsten Funktionen auszuprobieren."
      }
    ]

    const [openItems, setOpenItems] = useState<Set<number>>(new Set())

    const toggleItem = (index: number) => {
        const newOpenItems = new Set(openItems)

        if (newOpenItems.has(index)) newOpenItems.delete(index)
        else newOpenItems.add(index)

        setOpenItems(newOpenItems)
    }

    return (
        <Section showLinkButton={false}>
            <div className={"h-[60vh] flex flex-col gap-4 mx-4"}>
                {faqs.map((faq, index) => (
                    <AccordionItem key={index} {...faq} isOpen={openItems.has(index)} onToggle={() => toggleItem(index)} />
                ))}
            </div>
        </Section>
    )
}
