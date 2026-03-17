"use client"

import { InteractiveGridPattern } from "@/components/InteractiveGridPattern"
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
                className={"relative w-full overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_20px_70px_rgba(0,0,0,0.3)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-white/30 before:to-transparent before:content-['']"}
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.25 }}
            >
                <div className={"relative flex w-full flex-col items-center justify-center gap-8 overflow-hidden rounded-[calc(1.8rem-1px)] px-6 py-12 sm:px-10"}>

                    <InteractiveGridPattern
                        className={cn("opacity-45 mask-[radial-gradient(600px_circle_at_center,white,transparent)]")}
                        width={42}
                        height={48}
                        squares={[50, 10]}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_38%)]" />
                    <div className="pointer-events-none absolute -inset-16 opacity-14 blur-2xl [background:radial-gradient(circle,rgba(248,114,226,0.35),transparent_95%)]" />
                    <div className="pointer-events-none absolute inset-x-0 -top-24 h-56 bg-[radial-gradient(circle,rgba(122,203,255,0.18),transparent_70%)] blur-3xl" />

                    <motion.div variants={staggerItem} className={"relative z-20 flex size-32 items-center justify-center rounded-2xl bg-white/5 shadow-[0_18px_50px_rgba(0,0,0,0.25)] backdrop-blur-xl"}>
                        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_35%)]" />
                        <div className={"relative flex items-center justify-center rounded-2xl ring ring-white/10 bg-linear-to-br from-primary via-primary to-pink/8 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"}>
                            <Image src={"/code0_logo_white.png"} width={"112"} height={"112"} alt={"Code0 Logo"} className={"z-20"}/>
                        </div>
                    </motion.div>

                    <motion.p variants={staggerItem} className={"z-20 text-2xl sm:text-4xl text-white text-center font-semibold"}>
                        {content.heading}
                    </motion.p>
                    <motion.p variants={staggerItem} className={"w-4/5 sm:w-2/3 lg:w-1/2 z-20 text-md sm:text-lg text-white/75 text-center"}>
                        {content?.subheading}
                    </motion.p>

                    <motion.div variants={staggerItem} className={"z-20 flex items-center gap-4"}>
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
