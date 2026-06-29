"use client"

import { InteractiveGridPattern } from "@/components/InteractiveGridPattern"
import { HapticButtonLink } from "@/components/ui/HapticButtonLink"
import { Section } from "@/components/ui/Section"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { CtaLayoutBlock } from "@/lib/cms"
import { cn } from "@/lib/utils"
import { m as motion, type Variants } from "motion/react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { Card } from "../ui/Card"

interface CtaSectionProps {
    content?: CtaLayoutBlock | null
    floatingCta?: boolean
}

const STAGGER_CONTAINER: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.06 } },
}
const STAGGER_ITEM: Variants = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
}

export function CtaSection({ content, floatingCta = false }: CtaSectionProps) {
    const isTouchDevice = useMediaQuery("(hover: none), (pointer: coarse)")
    const [docked, setDocked] = useState(false)

    const buttonAnchorRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!floatingCta) return

        const anchor = buttonAnchorRef.current
        const button = buttonRef.current
        if (!anchor || !button) return

        const floatingBottomOffset = 24
        let intersectionObserver: IntersectionObserver | null = null

        const observeAnchor = () => {
            intersectionObserver?.disconnect()
            const buttonHeight = button.getBoundingClientRect().height
            const bottomMargin = floatingBottomOffset + buttonHeight

            intersectionObserver = new IntersectionObserver(
                ([entry]) => {
                    if (!entry) return

                    const nextDocked = entry.isIntersecting || entry.boundingClientRect.top < 0
                    setDocked((previous) => (previous === nextDocked ? previous : nextDocked))
                },
                {
                    rootMargin: `0px 0px -${bottomMargin}px 0px`,
                    threshold: 0,
                }
            )
            intersectionObserver.observe(anchor)
        }

        observeAnchor()
        const resizeObserver = new ResizeObserver(observeAnchor)
        resizeObserver.observe(button)

        return () => {
            intersectionObserver?.disconnect()
            resizeObserver.disconnect()
        }
    }, [floatingCta])

    if (!content) return null

    const baseCtaClassName = "h-10 px-8! whitespace-nowrap text-primary! transition-all duration-300"

    const inlineCtaClassName = "bg-white/80! hover:bg-white! ring-1! ring-white/20!"

    const floatingCtaClassName = "bg-white! hover:bg-white! hover:scale-105 ring-1! ring-white/20!"

    return (
        <Section showFunnel={false} animation={{ preset: floatingCta ? "none" : "fade-in" }}>
            <Card
                size={"lg"}
                className="p-0 w-full rounded-3xl"
                variants={STAGGER_CONTAINER}
                initial={floatingCta ? false : "hidden"}
                whileInView={floatingCta ? undefined : "show"}
                animate={floatingCta ? "show" : undefined}
                viewport={floatingCta ? undefined : { once: true, amount: 0.25 }}
            >
                <div className="relative flex w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl px-6 py-12 sm:px-10">
                    <InteractiveGridPattern className="mask-[radial-gradient(600px_circle_at_center,white,transparent)] rounded-3xl" width={40} height={40} squares={[35, 15]} />

                    <div
                        className={cn(
                            "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_36%),radial-gradient(circle_at_center,rgba(248,114,226,0.16),transparent_62%)]",
                            isTouchDevice && "opacity-70"
                        )}
                    />

                    <motion.div variants={STAGGER_ITEM} className="relative z-20 flex size-32 items-center justify-center rounded-2xl bg-white/5">
                        <div className="relative isolate flex items-center justify-center rounded-2xl px-4 py-4 ring ring-white/5">
                            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-primary via-primary to-slate-800" />
                            <Image src={"/code0_logo_white.png"} width={120} height={120} alt="Code0 Logo" className="z-20" />
                        </div>
                    </motion.div>

                    <motion.p variants={STAGGER_ITEM} className="z-20 text-center text-2xl font-semibold text-white sm:text-4xl">
                        {content.heading}
                    </motion.p>

                    <motion.p variants={STAGGER_ITEM} className="z-20 w-4/5 text-center text-secondary sm:w-2/3 sm:text-lg lg:w-1/2">
                        {content.subheading}
                    </motion.p>

                    <motion.div ref={buttonAnchorRef} variants={STAGGER_ITEM} className="z-20 mt-4 flex h-10 items-center justify-center">
                        <div ref={buttonRef} className={cn("flex items-center gap-4", floatingCta && !docked && "fixed bottom-6 left-1/2 z-50 -translate-x-1/2")}>
                            <HapticButtonLink
                                href={content.ctaLink.url}
                                variant="normal"
                                className={cn(
                                    baseCtaClassName,
                                    floatingCta ? floatingCtaClassName : inlineCtaClassName,
                                    floatingCta && (docked ? "shadow-none" : "shadow-[0_0_60px_20px_rgba(0,0,0,0.75)]")
                                )}
                            >
                                {content.ctaLink.label}
                            </HapticButtonLink>
                        </div>
                    </motion.div>
                </div>
            </Card>
        </Section>
    )
}
