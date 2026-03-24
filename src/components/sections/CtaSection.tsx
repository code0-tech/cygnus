"use client"

import { InteractiveGridPattern } from "@/components/InteractiveGridPattern"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { Section } from "@/components/ui/Section"
import { cn } from "@/lib/utils"
import Image from "next/image"
import React from "react"
import Link from "next/link"
import { Button } from "@code0-tech/pictor"
import { m as motion, type Variants } from "motion/react"
import { useWebHaptics } from "web-haptics/react"

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
}

export const CtaSection: React.FC<CtaSectionProps> = ({ content }) => {
    const { trigger } = useWebHaptics()
    const isTouchDevice = useMediaQuery("(hover: none), (pointer: coarse)")
    if (!content) return

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

    return (
        <Section showBlur={false} showFunnel={false} animationPreset="fade-in">
            <motion.div
                className={"glass-card-shell w-full rounded-[1.8rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]! shadow-lg!"}
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.25 }}
            >
                <div aria-hidden="true" className="glass-card-topline" />
                <div className={"relative flex w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-4xl px-6 py-12 sm:px-10"}>

                    <InteractiveGridPattern
                        className="mask-[radial-gradient(600px_circle_at_center,white,transparent)]"
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

                    <motion.div variants={staggerItem} className={"relative z-20 flex size-32 items-center justify-center rounded-2xl bg-white/5 shadow-[0_14px_36px_rgba(0,0,0,0.22)]"}>
                        <div className={"relative isolate flex items-center justify-center rounded-2xl ring ring-white/10 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"}>
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-primary via-primary to-[#2a1638]" />
                            <Image src={"/code0_logo_white.png"} width={"120"} height={"120"} alt={"Code0 Logo"} className={"z-20"}/>
                        </div>
                    </motion.div>

                    <motion.p variants={staggerItem} className={"z-20 text-2xl sm:text-4xl text-white text-center font-semibold"}>
                        {content.heading}
                    </motion.p>
                    <motion.p variants={staggerItem} className={"w-4/5 sm:w-2/3 lg:w-1/2 z-20 text-md sm:text-lg text-white/75 text-center"}>
                        {content?.subheading}
                    </motion.p>

                    <motion.div variants={staggerItem} className={"z-20 flex items-center gap-4 mt-4"}>
                        <Link href={content.ctaLink.url}>
                            <Button
                                variant="normal"
                                onClick={() => trigger("heavy")}
                                className={"h-10 flex items-center gap-2 px-8! text-base! bg-white/80! hover:bg-white! text-primary!"}
                            >
                                {content.ctaLink.label}
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </motion.div>
        </Section>
    )
}
