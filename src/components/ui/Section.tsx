"use client"

import { usePreloadedSection } from "@/components/providers/SectionsProvider"
import { LinkButton } from "@/components/ui/LinkButton"
import { getLocaleFromPath, localizeHref } from "@/lib/i18n"
import { ANIMATION_PRESETS, cn, type AnimationPreset } from "@/lib/utils"
import { Section as SectionDocument } from "@/payload-types"
import { motion } from "motion/react"
import { usePathname } from "next/navigation"
import { ReactNode } from "react"

interface SectionProps {
    children: ReactNode
    funnelType?: "center" | "left"
    sectionType?: NonNullable<SectionDocument["sectionType"]>
    showBlur?: boolean
    showFunnel?: boolean
    showLinkButton?: boolean
    fullHeight?: boolean
    animationPreset?: AnimationPreset
    animationDelay?: number
    animationDuration?: number
    animationOnce?: boolean
}

export function Section({
    sectionType,
    children,
    funnelType = "center",
    showBlur = true,
    showFunnel = true,
    showLinkButton = true,
    fullHeight = false,
    animationPreset = "fade-up",
    animationDelay = 0,
    animationDuration,
    animationOnce = true,
}: SectionProps) {
    const sectionData = usePreloadedSection(sectionType) as SectionDocument | null
    const pathname = usePathname()
    const locale = getLocaleFromPath(pathname)
    const rawLinkUrl = sectionData?.link_button?.url?.trim()
    const linkUrl = rawLinkUrl ? localizeHref(rawLinkUrl, locale) : undefined
    const animationConfig = animationPreset === "none" ? null : ANIMATION_PRESETS[animationPreset]

    return (
        <motion.section
            className={cn("relative overflow-visible flex flex-col gap-8 pt-16", fullHeight && "h-[200dvh] md:h-dvh")}
            initial={animationConfig?.initial}
            whileInView={animationConfig?.whileInView}
            viewport={animationConfig ? { once: animationOnce, amount: 0.2 } : undefined}
            transition={animationConfig
                ? {
                    ...animationConfig.transition,
                    delay: animationDelay,
                    duration: animationDuration ?? animationConfig.transition.duration,
                }
                : undefined}
        >
            {showBlur && (funnelType === "center" ? (
                <div className="pointer-events-none absolute inset-0 opacity-30 blur-md will-change-filter [background:radial-gradient(circle,rgba(255,255,255,0.45),transparent_60%)]" />
            ) : (
                <div />
            ))}
            {showFunnel && (
                funnelType === "center" ? (
                    <div className={"flex flex-col gap-4 items-center justify-center text-center"}>
                        <h1 className={"text-4xl text-white font-semibold"}>
                            {sectionData?.heading}
                        </h1>
                        <p className="relative z-10 max-w-[90vw] lg:w-1/2 text-center font-medium text-white/75 text-xl">
                            {sectionData?.subheading}
                        </p>
                        {showLinkButton && linkUrl &&
                            <LinkButton href={linkUrl}>
                                {sectionData?.link_button?.label}
                            </LinkButton>
                        }
                    </div>
                ) : (
                    <div className={"flex flex-col gap-4 text-left"}>
                        <h1 className={"text-4xl text-pink font-semibold"}>
                            {sectionData?.heading}
                        </h1>
                        <p className="relative z-10 max-w-[90vw] lg:w-1/2 font-medium text-white/75 text-xl">
                            {sectionData?.subheading}
                        </p>
                        {showLinkButton && linkUrl &&
                            <LinkButton href={linkUrl}>
                                {sectionData?.link_button?.label}
                            </LinkButton>
                        }
                    </div>
                )
            )}
            {children}
        </motion.section>
    )
}
