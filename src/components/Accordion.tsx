import {IconChevronDown} from "@tabler/icons-react"
import React from "react"

interface FAQItemProps {
    question: string
    answer: string
    isOpen: boolean
    onToggle: () => void
}

export const AccordionItem = ({ question, answer, isOpen, onToggle }: FAQItemProps) => {
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        onToggle()
    }
    return (
        <div
            className={`w-full bg-white/2 border border-white/10 shadow-[0px_2px_4px_rgba(0,0,0,0.16)] overflow-hidden rounded-xl transition-all duration-200 ease-linear cursor-pointer`}
            onClick={handleClick}
        >
            <div className="w-full px-5 py-[18px] pr-4 flex justify-between items-center gap-5 text-left transition-all duration-300 ease-out">
                <div className="flex-1 text-white/75 text-sm sm:text-md lg:text-lg font-medium break-words">{question}</div>
                <IconChevronDown className={`w-6 h-6 text-white/50 transition-all duration-500 ease-out ${isOpen ? "rotate-180" : "rotate-0"}`}/>
            </div>
            <div
                className={`overflow-hidden transition-all duration-500 ease-out ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
                style={{
                    transitionProperty: "max-height, opacity, padding",
                    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                }}
            >
                <div
                    className={`px-5 transition-all duration-500 ease-out ${isOpen ? "pb-[18px] pt-2 translate-y-0" : "pb-0 pt-0 -translate-y-2"}`}
                >
                    <div className="text-white/50 text-md  break-words">{answer}</div>
                </div>
            </div>
        </div>
    )
}