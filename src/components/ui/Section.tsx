"use client"

import { LinkButton } from "@/components/ui/LinkButton"
import { getLocaleFromPath, localizeHref } from "@/lib/i18n"
import { ANIMATION_PRESETS, cn, type AnimationPreset } from "@/lib/utils"
import { m as motion, type Variants } from "motion/react"
import { usePathname } from "next/navigation"
import { createElement, ReactNode, useEffect, useRef, useState } from "react"

interface SectionLinkButton {
    label?: string | null
    url?: string | null
}

function hasHighlightedHeading(heading?: string | null) {
    return Boolean(heading && /\*\*.*?\*\*/.test(heading))
}

function renderFormattedText(text: string) {
    return text.split(/(\*\*.*?\*\*)/g).flatMap((part, partIndex) => {
        const highlighted = part.startsWith("**") && part.endsWith("**") && part.length > 4
        const value = highlighted ? part.slice(2, -2) : part

        return value.split(/(\\n|\r\n|\n|\r)/g).map((linePart, lineIndex) => {
            const key = `${partIndex}-${lineIndex}`

            if (/^(\\n|\r\n|\n|\r)$/.test(linePart)) {
                return <br key={key} />
            }

            if (!highlighted) return linePart

            return (
                <span className="text-white" key={key}>
                    {linePart}
                </span>
            )
        })
    })
}

interface SectionProps {
    children: ReactNode
    funnelType?: "center" | "left"
    className?: string
    heading?: string | null
    description?: string | null
    linkButton?: SectionLinkButton | null
    showBlur?: boolean
    showFunnel?: boolean
    showLinkButton?: boolean
    fullHeight?: boolean
    animationPreset?: AnimationPreset
    animationDelay?: number
    animationDuration?: number
    animationOnce?: boolean
    animationViewportAmount?: number
    animationViewportMargin?: string
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
}

export function Section({
    heading,
    description,
    linkButton,
    children,
    className,
    funnelType = "center",
    showBlur = true,
    showFunnel = true,
    showLinkButton = true,
    fullHeight = false,
    animationPreset = "fade-up",
    animationDelay = 0,
    animationDuration,
    animationOnce = true,
    animationViewportAmount = 0.2,
    animationViewportMargin,
    headingLevel = 2,
}: SectionProps) {
    const sectionRef = useRef<HTMLElement | null>(null)
    const pathname = usePathname()
    const locale = getLocaleFromPath(pathname)
    const [isInView, setIsInView] = useState(false)
    const rawLinkUrl = linkButton?.url?.trim()
    const linkUrl = rawLinkUrl ? localizeHref(rawLinkUrl, locale) : undefined
    const shouldShowFunnel = showFunnel && Boolean(heading || description || (showLinkButton && linkUrl && linkButton?.label))
    const animationConfig = animationPreset === "none" ? null : ANIMATION_PRESETS[animationPreset]
    const staggerContainer: Variants = {
        hidden: {},
        show: {
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.04,
            },
        },
    }
    const staggerItem: Variants = {
        hidden: { opacity: 0, y: 16 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
            },
        },
    }
    const headingTag = `h${headingLevel}` as const
    const headingClassName = cn("text-4xl font-semibold", hasHighlightedHeading(heading) ? "text-secondary" : "text-white")

    useEffect(() => {
        const currentRef = sectionRef.current
        if (!currentRef) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    setIsInView(true)
                    observer.unobserve(currentRef)
                }
            },
            { rootMargin: "100px" }
        )

        observer.observe(currentRef)

        return () => observer.disconnect()
    }, [])

    return (
        <motion.section
            ref={sectionRef}
            data-in-view={isInView}
            className={cn("group/section relative overflow-visible flex flex-col gap-8", fullHeight && "h-[200dvh] md:h-[min(100dvh,1080px)]", className)}
            initial={animationConfig?.initial}
            whileInView={animationConfig?.whileInView}
            viewport={animationConfig ? { once: animationOnce, amount: animationViewportAmount, margin: animationViewportMargin } : undefined}
            transition={
                animationConfig
                    ? {
                          ...animationConfig.transition,
                          delay: animationDelay,
                          duration: animationDuration ?? animationConfig.transition.duration,
                      }
                    : undefined
            }
        >
            {showBlur && funnelType === "center" && (
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-60 -top-24 left-1/2 w-[120vw] max-w-none -translate-x-1/2 [background:radial-gradient(circle,rgba(255,255,255,0.1),transparent_70%)] md:inset-x-0 md:w-auto md:translate-x-0"
                />
            )}
            {shouldShowFunnel &&
                (funnelType === "center" ? (
                    <motion.div
                        className={"flex flex-col gap-4 items-center justify-center text-center"}
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: animationOnce, amount: 0.3 }}
                    >
                        {createElement(motion[headingTag], { variants: staggerItem, className: headingClassName }, heading ? renderFormattedText(heading) : null)}
                        {description && (
                            <motion.p variants={staggerItem} className="relative z-10 max-w-[90vw] text-center text-xl font-medium text-white/75 lg:w-1/2">
                                {renderFormattedText(description)}
                            </motion.p>
                        )}
                        {showLinkButton && linkUrl && (
                            <motion.div variants={staggerItem}>
                                <LinkButton href={linkUrl}>{linkButton?.label}</LinkButton>
                            </motion.div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div className={"flex flex-col gap-4 text-left"} variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: animationOnce, amount: 0.3 }}>
                        {createElement(motion[headingTag], { variants: staggerItem, className: headingClassName }, heading ? renderFormattedText(heading) : null)}
                        {description && (
                            <motion.p variants={staggerItem} className="relative z-10 max-w-[90vw] text-xl font-medium text-white/75 lg:w-1/2">
                                {renderFormattedText(description)}
                            </motion.p>
                        )}
                        {showLinkButton && linkUrl && (
                            <motion.div variants={staggerItem}>
                                <LinkButton href={linkUrl}>{linkButton?.label}</LinkButton>
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            {children}
        </motion.section>
    )
}
