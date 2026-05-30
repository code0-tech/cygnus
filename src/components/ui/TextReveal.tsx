"use client"

import { useRef, type ComponentPropsWithoutRef, type ReactNode } from "react"
import { m, MotionValue, useScroll, useTransform } from "motion/react"

import { cn } from "@/lib/utils"

export interface TextRevealProps extends ComponentPropsWithoutRef<"span"> {
    children: string
    highlightClassName?: string
}

type TextToken =
    | {
        type: "word"
        value: string
        highlighted: boolean
    }
    | {
        type: "break"
    }

interface WordProps {
    children: ReactNode
    progress: MotionValue<number>
    range: [number, number]
    className?: string
}

function getTextTokens(text: string): TextToken[] {
    const parts = text.split(/(\*\*.*?\*\*)/g)

    return parts.flatMap((part) => {
        const highlighted = part.startsWith("**") && part.endsWith("**") && part.length > 4
        const value = highlighted ? part.slice(2, -2) : part

        return value.split(/(\\n|\r\n|\n|\r)/g).flatMap((linePart): TextToken[] => {
            if (!linePart) return []
            if (/^(\\n|\r\n|\n|\r)$/.test(linePart)) return [{ type: "break" }]

            return linePart
                .split(/[^\S\r\n]+/)
                .filter(Boolean)
                .map((word) => ({ type: "word", value: word, highlighted }))
        })
    })
}

export const TextReveal: React.FC<TextRevealProps> = ({ children, className, highlightClassName = "text-white", ...props }) => {
    const textRef = useRef<HTMLSpanElement | null>(null)
    const { scrollYProgress } = useScroll({
        target: textRef,
        offset: ["start 85%", "end 55%"],
    })
    const tokens = getTextTokens(children)
    const wordCount = tokens.filter((token) => token.type === "word").length
    let wordIndex = 0

    return (
        <span ref={textRef} className={cn("inline", className)} {...props}>
            {tokens.map((token, index) => {
                if (token.type === "break") {
                    return <br key={`break-${index}`} />
                }

                const start = wordIndex / wordCount
                const end = start + 1 / wordCount
                wordIndex += 1

                return (
                    <Word
                        key={`${token.value}-${index}`}
                        progress={scrollYProgress}
                        range={[start, end]}
                        className={token.highlighted ? highlightClassName : undefined}
                    >
                        {token.value}
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
