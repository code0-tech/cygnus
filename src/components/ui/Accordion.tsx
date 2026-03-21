import {IconChevronDown} from "@tabler/icons-react"
import { m as motion } from "motion/react"
import React from "react"
import { cn } from "@/lib/utils"

const accordionCardBaseClassName =
    "group relative z-10 w-full cursor-pointer overflow-hidden rounded-2xl hover:bg-white/5 transition-colors border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_18px_50px_rgba(0,0,0,0.22)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-white/30 before:to-transparent before:content-['']"

const accordionCardOpenClassName =
    "border-white/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[0_24px_70px_rgba(0,0,0,0.3)]"

interface FAQItemProps {
    index: number
    question: string
    answer: string
    isOpen: boolean
    onToggle: (index: number) => void
}

const AccordionItemComponent = ({ index, question, answer, isOpen, onToggle }: FAQItemProps) => {
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        onToggle(index)
    }

    return (
        <div
            className={cn(
                accordionCardBaseClassName,
                isOpen && accordionCardOpenClassName
            )}
            onClick={handleClick}
        >

            <div className="relative z-10 flex w-full items-center justify-between gap-5 px-5 py-4.5 pr-4 text-left">
                <div className={cn("flex-1 text-sm font-medium text-white/80 sm:text-base lg:text-lg wrap-break-word transition-colors", isOpen && "text-white")}>{question}</div>
                <div
                    className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center text-white/55 transition-transform",
                        isOpen && "rotate-180"
                    )}
                >
                    <IconChevronDown className="h-5 w-5"/>
                </div>
            </div>
            <motion.div
                initial={false}
                animate={{
                    height: isOpen ? "auto" : 0,
                    opacity: isOpen ? 1 : 0,
                }}
                transition={{
                    height: {
                        duration: 0.32,
                        ease: [0.22, 1, 0.36, 1],
                    },
                    opacity: {
                        duration: isOpen ? 0.2 : 0.14,
                        delay: isOpen ? 0.06 : 0,
                        ease: "easeOut",
                    },
                }}
                aria-hidden={!isOpen}
                className="overflow-hidden"
            >
                <motion.div
                    initial={false}
                    animate={{ y: isOpen ? 0 : -2 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="min-h-0"
                >
                    <div className="relative z-10 px-5 pb-5 pt-1">
                        <div className="text-sm leading-7 text-white/62 sm:text-base wrap-break-word">{answer}</div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    )
}

export const AccordionItem = React.memo(AccordionItemComponent)
