import { cn } from "@/lib/utils"
import { IconChevronDown } from "@tabler/icons-react"
import { m as motion } from "motion/react"
import React, { useLayoutEffect, useRef, useState } from "react"

interface FAQItemProps {
    index: number
    question: string
    answer: React.ReactNode
    isOpen: boolean
    onToggle: (index: number) => void
    className?: string
    questionClassname?: string
}

const AccordionItemComponent = ({ index, question, answer, isOpen, onToggle, className, questionClassname }: FAQItemProps) => {
    const contentRef = useRef<HTMLDivElement>(null)
    const [contentHeight, setContentHeight] = useState(0)

    useLayoutEffect(() => {
        const element = contentRef.current
        if (!element) return

        const measure = () => {
            setContentHeight(element.scrollHeight)
        }

        measure()

        const resizeObserver = new ResizeObserver(measure)
        resizeObserver.observe(element)

        return () => resizeObserver.disconnect()
    }, [answer, question])

    return (
        <div
            className={cn(
                "group relative z-10 w-full cursor-pointer overflow-hidden rounded-2xl bg-white/2 hover:bg-white/5 transition-colors",
                "border border-white/5 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-linear-to-r",
                "before:from-transparent before:via-white/30 before:to-transparent before:content-['']",
                isOpen && "border-white/10 bg-white/5",
                className
            )}
        >
            <button
                type="button"
                onClick={() => onToggle(index)}
                aria-expanded={isOpen}
                className={cn("relative z-10 flex w-full items-center justify-between gap-5 px-5 py-4 pr-4 text-left", questionClassname)}
            >
                <div className={cn("flex-1 text-sm font-medium text-white/75 sm:text-base lg:text-lg wrap-break-word transition-colors", isOpen && "text-white")}>{question}</div>
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center text-white/55 transition-transform", isOpen && "rotate-180")}>
                    <IconChevronDown className="h-5 w-5" />
                </div>
            </button>
            <motion.div
                initial={false}
                animate={{
                    height: isOpen ? contentHeight : 0,
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
                <motion.div ref={contentRef} initial={false} animate={{ y: isOpen ? 0 : -2 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} className="min-h-0">
                    <div className="relative z-10 px-5 pb-5 pt-1">
                        <div className="text-sm leading-7 text-white/75 sm:text-base wrap-break-word">{answer}</div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    )
}

export const AccordionItem = React.memo(AccordionItemComponent)

const BaseAccordionItemComponent = ({ index, question, answer, isOpen, onToggle, className, questionClassname }: FAQItemProps) => {
    return (
        <div className={cn("group relative z-10 w-full cursor-pointer overflow-hidden rounded-2xl border border-white/5", isOpen && "border-white/10", className)}>
            <button
                type="button"
                onClick={() => onToggle(index)}
                aria-expanded={isOpen}
                className={cn("relative z-10 flex w-full items-center justify-between gap-5 px-5 py-4 pr-4 text-left text-sm font-medium sm:text-base lg:text-lg wrap-break-word", questionClassname)}
            >
                <p className={cn("flex-1 text-white/75", isOpen && "text-white")}>{question}</p>
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center text-white/50 transition-transform", isOpen && "rotate-180")}>
                    <IconChevronDown className="h-5 w-5" />
                </div>
            </button>
            {isOpen && (
                <div className="overflow-hidden" aria-hidden={!isOpen}>
                    <div className="min-h-0">
                        <div className="relative z-10 px-5 pb-5 pt-1">
                            <div className="text-sm leading-7 text-white/50 sm:text-base wrap-break-word">{answer}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export const BaseAccordionItem = React.memo(BaseAccordionItemComponent)
