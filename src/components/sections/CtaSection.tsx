"use client"

import { InteractiveGridPattern } from "@/components/InteractiveGridPattern"
import { HapticButtonLink } from "@/components/ui/HapticButtonLink"
import { Section } from "@/components/ui/Section"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import type { AppLocale } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { m as motion, type Variants } from "motion/react"
import Image from "next/image"
import React, { useEffect, useRef, useState } from "react"

interface CtaSectionContent {
    heading: string
    subheading: string
    ctaLink: {
        label: string
        url: string
    }
}

interface CtaSectionProps {
    content?: CtaSectionContent | null
    floatingCta?: boolean
    locale?: AppLocale
}

export const CtaSection: React.FC<CtaSectionProps> = ({ content, floatingCta = false, locale }) => {
    const isTouchDevice = useMediaQuery("(hover: none), (pointer: coarse)")
    const [mounted, setMounted] = useState(false)
    const [docked, setDocked] = useState(false)

    const buttonAnchorRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!floatingCta) {
            setDocked(false)
            return
        }

        if (!mounted) return

        const anchor = buttonAnchorRef.current
        const button = buttonRef.current
        if (!anchor || !button) return

        const floatingBottomOffset = 24
        const hysteresis = 8
        let frame = 0

        const updateDocked = () => {
            const anchorTop = anchor.getBoundingClientRect().top
            const buttonHeight = button.getBoundingClientRect().height
            const switchLine = window.innerHeight - floatingBottomOffset - buttonHeight

            setDocked((previous) => {
                if (previous) {
                    return anchorTop <= switchLine + hysteresis
                }
                return anchorTop <= switchLine - hysteresis
            })
        }

        const handleViewportChange = () => {
            if (frame) return
            frame = requestAnimationFrame(() => {
                frame = 0
                updateDocked()
            })
        }

        updateDocked()
        window.addEventListener("scroll", handleViewportChange, { passive: true })
        window.addEventListener("resize", handleViewportChange)

        return () => {
            if (frame) {
                cancelAnimationFrame(frame)
            }
            window.removeEventListener("scroll", handleViewportChange)
            window.removeEventListener("resize", handleViewportChange)
        }
    }, [floatingCta, mounted])

    if (!content) return null

    const staggerContainer: Variants = {
        hidden: {},
        show: {
            transition: {
                staggerChildren: 0.12,
                delayChildren: 0.06,
            },
        },
    }

    const staggerItem: Variants = {
        hidden: { opacity: 0, y: 18 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.42,
                ease: [0.22, 1, 0.36, 1],
            },
        },
    }

    const baseCtaClassName =
        "h-10 px-8! whitespace-nowrap text-primary! transition-all duration-300"

    const inlineCtaClassName =
        "bg-white/80! hover:bg-white! ring-1! ring-white/20!"

    const floatingCtaClassName =
        "bg-white! hover:bg-white! hover:scale-102 ring-1! ring-white/20! shadow-[0_0_60px_20px_rgba(0,0,0,0.75)]"

    return (
        <Section
            showBlur={false}
            showFunnel={false}
            animationPreset={floatingCta ? "none" : "fade-in"}
        >
            <motion.div
                className="glass-card-shell w-full rounded-3xl bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]! shadow-lg!"
                variants={staggerContainer}
                initial={floatingCta ? false : "hidden"}
                whileInView={floatingCta ? undefined : "show"}
                animate={floatingCta ? "show" : undefined}
                viewport={floatingCta ? undefined : { once: true, amount: 0.25 }}
            >
                <div aria-hidden="true" className="glass-card-topline" />

                <div className="relative flex w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl px-6 py-12 sm:px-10">
                    <InteractiveGridPattern
                        className="mask-[radial-gradient(600px_circle_at_center,white,transparent)] rounded-3xl"
                        width={40}
                        height={40}
                        squares={[35, 15]}
                    />

                    <div
                        className={cn(
                            "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_36%),radial-gradient(circle_at_center,rgba(248,114,226,0.16),transparent_62%)]",
                            isTouchDevice && "opacity-70",
                        )}
                    />

                    <motion.div
                        variants={staggerItem}
                        className="relative z-20 flex size-32 items-center justify-center rounded-2xl bg-white/5 shadow-[0_14px_36px_rgba(0,0,0,0.22)]"
                    >
                        <div className="relative isolate flex items-center justify-center rounded-2xl px-4 py-4 ring ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-primary via-primary to-[#2a1638]"
                            />
                            <Image
                                src={"/code0_logo_white.png"}
                                width={120}
                                height={120}
                                alt="Code0 Logo"
                                className="z-20"
                            />
                        </div>
                    </motion.div>

                    <motion.p
                        variants={staggerItem}
                        className="z-20 text-center text-2xl font-semibold text-white sm:text-4xl"
                    >
                        {content.heading}
                    </motion.p>

                    <motion.p
                        variants={staggerItem}
                        className="z-20 w-4/5 text-center text-md text-white/75 sm:w-2/3 sm:text-lg lg:w-1/2"
                    >
                        {content.subheading}
                    </motion.p>

                    <motion.div
                        ref={buttonAnchorRef}
                        variants={staggerItem}
                        className="z-20 mt-4 flex h-10 items-center justify-center"
                    >
                        <div
                            ref={buttonRef}
                            className={cn(
                                "flex items-center gap-4",
                                floatingCta && mounted && !docked && "fixed bottom-6 left-1/2 z-50 -translate-x-1/2",
                            )}
                        >
                            <HapticButtonLink
                                href={content.ctaLink.url}
                                variant="normal"
                                className={cn(
                                    baseCtaClassName,
                                    floatingCta ? floatingCtaClassName : inlineCtaClassName,
                                )}
                            >
                                {content.ctaLink.label}
                            </HapticButtonLink>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </Section>
    )
}
