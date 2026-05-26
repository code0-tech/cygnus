"use client"

import { useRef, type ComponentPropsWithoutRef, type ReactNode } from "react"
import { m, MotionValue, useScroll, useTransform } from "motion/react"

import { cn } from "@/lib/utils"

export interface TextRevealProps extends ComponentPropsWithoutRef<"span"> {
    children: string
    highlightClassName?: string
}

interface WordToken {
    value: string
    highlighted: boolean
}

interface WordProps {
    children: ReactNode
    progress: MotionValue<number>
    range: [number, number]
    className?: string
}

function getWordTokens(text: string): WordToken[] {
    const parts = text.split(/(\*\*.*?\*\*)/g)

    return parts.flatMap((part) => {
        const highlighted = part.startsWith("**") && part.endsWith("**") && part.length > 4
        const value = highlighted ? part.slice(2, -2) : part

        return value
            .split(/\s+/)
            .filter(Boolean)
            .map((word) => ({ value: word, highlighted }))
    })
}

export const TextReveal: React.FC<TextRevealProps> = ({ children, className, highlightClassName = "text-white", ...props }) => {
    const textRef = useRef<HTMLSpanElement | null>(null)
    const { scrollYProgress } = useScroll({
        target: textRef,
        offset: ["start 85%", "end 55%"],
    })
    const words = getWordTokens(children)

    return (
        <span ref={textRef} className={cn("inline", className)} {...props}>
            {words.map((word, index) => {
                const start = index / words.length
                const end = start + 1 / words.length

                return (
                    <Word
                        key={`${word.value}-${index}`}
                        progress={scrollYProgress}
                        range={[start, end]}
                        className={word.highlighted ? highlightClassName : undefined}
                    >
                        {word.value}
                    </Word>
                )
            })}
        </span>
    )
}

const Word: React.FC<WordProps> = ({ children, progress, range, className }) => {
    const opacity = useTransform(progress, range, [0, 1])

    return (
        <span className={cn("relative mr-[0.28em] inline-block", className)}>
            <span className="opacity-30">{children}</span>
            <m.span
                aria-hidden="true"
                style={{ opacity }}
                className="absolute inset-0"
            >
                {children}
            </m.span>
        </span>
    )
}
