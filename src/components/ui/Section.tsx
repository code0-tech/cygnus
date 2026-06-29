"use client"

import { LinkButton } from "@/components/ui/LinkButton"
import { getLocaleFromPath, localizeHref } from "@/lib/i18n"
import { ANIMATION_PRESETS, cn, type AnimationPreset } from "@/lib/utils"
import { m as motion, type Variants } from "motion/react"
import { usePathname } from "next/navigation"
import { createElement, ReactNode, useEffect, useRef } from "react"

interface SectionLinkButton {
    label?: string | null
    url?: string | null
}

function hasHighlightedHeading(heading?: string | null) {
    return Boolean(heading && /\*\*.*?\*\*/.test(heading))
}

function FormattedText({ text }: { text: string }) {
    return (
        <>
            {text.split(/(\*\*.*?\*\*)/g).flatMap((part, partIndex) => {
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
            })}
        </>
    )
}

interface SectionProps {
    children: ReactNode
    funnelType?: "center" | "left"
    className?: string
    heading?: string | null
    description?: string | null
    linkButton?: SectionLinkButton | null
    showFunnel?: boolean
    showLinkButton?: boolean
    fullHeight?: boolean
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
    animation?: {
        preset?: AnimationPreset
        delay?: number
        duration?: number
        once?: boolean
        viewportAmount?: number
        viewportMargin?: string
    }
}

const DEFAULT_SECTION_ANIMATION: NonNullable<SectionProps["animation"]> = {}
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

export function Section({
    heading,
    description,
    linkButton,
    children,
    className,
    funnelType = "center",
    showFunnel = true,
    showLinkButton = true,
    fullHeight = false,
    animation = DEFAULT_SECTION_ANIMATION,
    headingLevel = 2,
}: SectionProps) {
    const { preset = "fade-up", delay = 0, duration, once = true, viewportAmount = 0.2, viewportMargin } = animation
    const sectionRef = useRef<HTMLElement | null>(null)
    const pathname = usePathname()
    const locale = getLocaleFromPath(pathname)
    const rawLinkUrl = linkButton?.url?.trim()
    const linkUrl = rawLinkUrl ? localizeHref(rawLinkUrl, locale) : undefined
    const shouldShowFunnel = showFunnel && Boolean(heading || description || (showLinkButton && linkUrl && linkButton?.label))
    const animationConfig = preset === "none" ? null : ANIMATION_PRESETS[preset]
    const headingTag = `h${headingLevel}` as const
    const headingClassName = cn("text-4xl font-semibold", hasHighlightedHeading(heading) ? "text-secondary" : "text-white")

    useEffect(() => {
        const currentRef = sectionRef.current
        if (!currentRef) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    currentRef.dataset.inView = "true"
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
            data-in-view="false"
            className={cn("group/section relative overflow-hidden flex flex-col gap-8", fullHeight && "h-[200dvh] md:h-[min(100dvh,1080px)]", className)}
            initial={animationConfig?.initial}
            whileInView={animationConfig?.whileInView}
            viewport={animationConfig ? { once, amount: viewportAmount, margin: viewportMargin } : undefined}
            transition={
                animationConfig
                    ? {
                          ...animationConfig.transition,
                          delay: delay,
                          duration: duration ?? animationConfig.transition.duration,
                      }
                    : undefined
            }
        >
            {shouldShowFunnel &&
                (funnelType === "center" ? (
                    <motion.div
                        className={"flex flex-col gap-4 items-center justify-center text-center"}
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once, amount: 0.3 }}
                    >
                        {createElement(motion[headingTag], { variants: staggerItem, className: headingClassName }, heading ? <FormattedText text={heading} /> : null)}
                        {description && (
                            <motion.p variants={staggerItem} className="relative z-10 max-w-[90vw] text-center text-xl font-medium text-secondary lg:w-1/2">
                                <FormattedText text={description} />
                            </motion.p>
                        )}
                        {showLinkButton && linkUrl && (
                            <motion.div variants={staggerItem}>
                                <LinkButton href={linkUrl}>{linkButton?.label}</LinkButton>
                            </motion.div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div className={"flex flex-col gap-4 text-left"} variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once, amount: 0.3 }}>
                        {createElement(motion[headingTag], { variants: staggerItem, className: headingClassName }, heading ? <FormattedText text={heading} /> : null)}
                        {description && (
                            <motion.p variants={staggerItem} className="relative z-10 max-w-[90vw] text-xl font-medium text-secondary lg:w-1/2">
                                <FormattedText text={description} />
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
