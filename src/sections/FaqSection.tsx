import React, {useState} from "react"
import {AccordionItem} from "@/components/Accordion"

const faqData = [
    {
        question: "What is Pointer and who is it for?",
        answer:
            "Pointer is an AI-powered development platform designed for developers, teams, and organizations who want toaccelerate their coding workflow. It's perfect for both individual developers looking to enhance their productivity and teams seeking seamless collaboration tools.",
    },
    {
        question: "How does Pointer's AI code review work?",
        answer:
            "Our AI analyzes your code in real-time, providing intelligent suggestions for improvements, catching potential bugs, and ensuring best practices. It learns from your coding patterns and adapts to your team's standards, making code reviews faster and more consistent.",
    },
    {
        question: "Can I integrate Pointer with my existing tools?",
        answer:
            "Yes! Pointer offers one-click integrations with popular development tools including GitHub, GitLab, VS Code, Slack, and many more. Our MCP connectivity allows you to easily manage and configure server access across your entire development stack.",
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
