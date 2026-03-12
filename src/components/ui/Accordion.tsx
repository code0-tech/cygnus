import {IconChevronDown} from "@tabler/icons-react"
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
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_30%)]" />
            <div className="pointer-events-none absolute -left-8 top-0 h-28 w-28 rounded-full bg-brand/10 blur-3xl transition-opacity duration-300 group-hover:opacity-100 opacity-70" />

            <div className="relative z-10 flex w-full items-center justify-between gap-5 px-5 py-4.5 pr-4 text-left">
                <div className={cn("flex-1 text-sm font-medium text-white/80 sm:text-base lg:text-lg wrap-break-word transition-colors", isOpen && "text-white")}>{question}</div>
                <div
                    className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center text-white/55 transition-transform duration-300 will-change-transform",
                        isOpen && "rotate-180"
                    )}
                >
                    <IconChevronDown className="h-5 w-5"/>
                </div>
            </div>
            <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
            >
                <div className="overflow-hidden">
                    <div className="relative z-10 px-5 pb-5 pt-1">
                        <div className="text-sm leading-7 text-white/62 sm:text-base wrap-break-word">{answer}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export const AccordionItem = React.memo(AccordionItemComponent)
