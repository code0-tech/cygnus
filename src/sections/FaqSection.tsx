import React, {useState} from "react"
import {AccordionItem} from "@/components/Accordion"

const faqData = [
    {
        question: "Lorem ipsum dolor sit amet, consetetur sadipscing elitr",
        answer: "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum."
    },
    {
        question: "Lorem ipsum dolor sit amet, consetetur sadipscing elitr?",
        answer: "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum."
    },
    {
        question: "Lorem ipsum dolor sit amet, consetetur sadipscing elitr?",
        answer: "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum."
    }
]

export const FaqSection: React.FC = () => {
    const [openItems, setOpenItems] = useState<Set<number>>(new Set())

    const toggleItem = (index: number) => {
        const newOpenItems = new Set(openItems)

        if (newOpenItems.has(index)) newOpenItems.delete(index)
        else newOpenItems.add(index)

        setOpenItems(newOpenItems)
    }

    return (
        <div className={"flex flex-col gap-8 items-center justify-center py-40 px-[10%] md:px-[24%]"}>
            <p className={"text-xl text-white/75"}>Frequently asked questions</p>
            <div className={"flex flex-col gap-4"}>
                {faqData.map((faq, index) => (
                    <AccordionItem key={index} {...faq} isOpen={openItems.has(index)} onToggle={() => toggleItem(index)} />
                ))}
            </div>
        </div>
    )
}
