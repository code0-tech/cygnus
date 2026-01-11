import {IconChevronDown} from "@tabler/icons-react"
import React from "react"
import {motion} from "motion/react"

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
            className={`w-full bg-white/2 border border-white/10 shadow-[0px_2px_4px_rgba(0,0,0,0.16)] overflow-hidden rounded-xl transition-colors duration-200 ease-linear cursor-pointer hover:bg-white/5`}
            onClick={handleClick}
        >
            <div className="w-full px-5 py-[18px] pr-4 flex justify-between items-center gap-5 text-left">
                <div className="flex-1 text-white/75 text-sm sm:text-md lg:text-lg font-medium break-words">{question}</div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "circOut" }}
                >
                    <IconChevronDown className="w-6 h-6 text-white/50"/>
                </motion.div>
            </div>
            <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
            >
                <div className="overflow-hidden">
                    <div className="px-5 pb-[18px] pt-2">
                        <div className="text-white/50 text-md break-words">{answer}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}