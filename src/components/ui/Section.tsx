"use client"

import { usePreloadedSection } from "@/components/providers/SectionsProvider"
import { LinkButton } from "@/components/ui/LinkButton"
import { getLocaleFromPath, localizeHref } from "@/lib/i18n"
import { ANIMATION_PRESETS, cn, type AnimationPreset } from "@/lib/utils"
import { Section as SectionDocument } from "@/payload-types"
import { m as motion, type Variants } from "motion/react"
import { usePathname } from "next/navigation"
import { createElement, ReactNode, useEffect, useRef, useState } from "react"

interface SectionProps {
    children: ReactNode
    funnelType?: "center" | "left"
    className?: string
    sectionType?: NonNullable<SectionDocument["sectionType"]>
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
    sectionType,
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
    const sectionData = usePreloadedSection(sectionType) as SectionDocument | null
    const sectionRef = useRef<HTMLElement | null>(null)
    const pathname = usePathname()
    const locale = getLocaleFromPath(pathname)
    const [isInView, setIsInView] = useState(false)
    const rawLinkUrl = sectionData?.link_button?.url?.trim()
    const linkUrl = rawLinkUrl ? localizeHref(rawLinkUrl, locale) : undefined
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
            { rootMargin: "100px" },
        )

        observer.observe(currentRef)

        return () => observer.disconnect()
    }, [])

    return (
        <motion.section
            ref={sectionRef}
            data-in-view={isInView}
            className={cn(
                "group/section relative overflow-visible flex flex-col gap-8",
                fullHeight && "h-[200dvh] md:h-[min(100dvh,1080px)]",
                className,
            )}
            initial={animationConfig?.initial}
            whileInView={animationConfig?.whileInView}
            viewport={animationConfig ? { once: animationOnce, amount: animationViewportAmount, margin: animationViewportMargin } : undefined}
            transition={animationConfig
                ? {
                    ...animationConfig.transition,
                    delay: animationDelay,
                    duration: animationDuration ?? animationConfig.transition.duration,
                }
                : undefined}
        >
            {showBlur && funnelType === "center" && (
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-60 -top-24 left-1/2 w-[120vw] max-w-none -translate-x-1/2 [background:radial-gradient(circle,rgba(255,255,255,0.1),transparent_70%)] md:inset-x-0 md:w-auto md:translate-x-0" />
            )}
            {showFunnel && (
                funnelType === "center" ? (
                    <motion.div
                        className={"flex flex-col gap-4 items-center justify-center text-center"}
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: animationOnce, amount: 0.3 }}
                    >
                        {createElement(
                            motion[headingTag],
                            { variants: staggerItem, className: "text-4xl text-white font-semibold" },
                            sectionData?.heading,
                        )}
                        <motion.p variants={staggerItem} className="relative z-10 max-w-[90vw] lg:w-1/2 text-center font-medium text-white/75 text-xl">
                            {sectionData?.subheading}
                        </motion.p>
                        {showLinkButton && linkUrl &&
                            <motion.div variants={staggerItem}>
                                <LinkButton href={linkUrl}>
                                    {sectionData?.link_button?.label}
                                </LinkButton>
                            </motion.div>
                        }
                    </motion.div>
                ) : (
                    <motion.div
                        className={"flex flex-col gap-4 text-left"}
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: animationOnce, amount: 0.3 }}
                    >
                        {createElement(
                            motion[headingTag],
                            { variants: staggerItem, className: "text-4xl text-white font-semibold" },
                            sectionData?.heading,
                        )}
                        <motion.p variants={staggerItem} className="relative z-10 max-w-[90vw] lg:w-1/2 font-medium text-white/75 text-xl">
                            {sectionData?.subheading}
                        </motion.p>
                        {showLinkButton && linkUrl &&
                            <motion.div variants={staggerItem}>
                                <LinkButton href={linkUrl}>
                                    {sectionData?.link_button?.label}
                                </LinkButton>
                            </motion.div>
                        }
                    </motion.div>
                )
            )}
            {children}
        </motion.section>
    )
}
