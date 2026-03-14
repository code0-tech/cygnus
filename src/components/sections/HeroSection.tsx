"use client"

import { Section } from "@/components/ui/Section"
import { cn } from "@/lib/utils"
import { Button } from "@code0-tech/pictor"
import { motion, type Variants } from "motion/react"
import Image from "next/image"
import Link from "next/link"
import React from "react"
import Grainient from "../ui/Granient"
import { useWebHaptics } from "web-haptics/react"
import { HeroBadge } from "../badges/HeroBadge"

interface HeroSectionButton {
    label: string
    url: string
    variant?: "none" | "normal" | "outlined" | "filled" | null
    id?: string | null
}

interface HeroSectionText {
    text: string
    id?: string | null
}

interface HeroSectionContent {
    badge?: string | null
    heading?: string | null
    texts?: HeroSectionText[] | null
    buttons?: HeroSectionButton[] | null
}

interface HeroSectionProps {
    content?: HeroSectionContent | null
}

export const HeroSection: React.FC<HeroSectionProps> = ({ content }) => {
    const { trigger } = useWebHaptics()
    if (!content || !content.texts || !content.buttons) return

    const staggerContainer: Variants = {
        hidden: {},
        show: {
            transition: {
                staggerChildren: 0.12,
                delayChildren: 0.08,
            },
        },
    }

    const staggerItem: Variants = {
        hidden: { opacity: 0, y: 18 },
        show: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
        },
    }

    return (
        <Section showBlur={false} showFunnel={false}>

            <div className="relative h-[85vh] overflow-hidden rounded-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_24px_80px_rgba(0,0,0,0.34)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-white/30 before:to-transparent before:content-['']">

                <div className="pointer-events-none absolute inset-0 -z-10 bg-[#0f0c1f]">
                    <Grainient
                        color1="#13102d"
                        color2="#f872e2"
                        color3="#7472f8"
                        timeSpeed={0.25}
                        colorBalance={0}
                        warpStrength={1}
                        warpFrequency={5}
                        warpSpeed={2}
                        warpAmplitude={50}
                        blendAngle={0}
                        blendSoftness={0.05}
                        rotationAmount={500}
                        noiseScale={2}
                        grainAmount={0.1}
                        grainScale={2}
                        grainAnimated={false}
                        contrast={1.5}
                        gamma={1}
                        saturation={1}
                        centerX={0}
                        centerY={0}
                        zoom={0.9}
                    />
                </div>

                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_36%)]" />

                <motion.div
                    className={"relative z-10 flex h-full flex-col items-center justify-between gap-12 rounded-[calc(1.9rem-1px)] px-8 py-12 lg:flex-row lg:px-16 lg:py-24"}
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.25 }}
                >

                    <div className="w-full lg:w-2/5 flex flex-col gap-4 text-start">
                        <motion.div variants={staggerItem}>
                            <HeroBadge badge={content.badge}/>
                        </motion.div>

                        <motion.h1 variants={staggerItem} className="relative z-10 font-bold text-3xl lg:text-4xl text-white text-balance">
                            {content.heading}
                        </motion.h1>

                        <motion.p variants={staggerItem} className="relative z-10 font-medium text-white/75 text-lg lg:text-xl text-balance">
                            {content.texts.length > 0
                                ? content.texts.map((item, index) => (
                                    <React.Fragment key={`${item.id ?? item.text}-${index}`}>
                                        {item.text}
                                        {index < content.texts!!.length - 1 && <br />}
                                    </React.Fragment>
                                ))
                                : <>Beschreibung1 <br /> Beschreibung2</>}
                        </motion.p>

                        <motion.div variants={staggerItem} className={"flex flex-col gap-4 mt-4"}>
                            {content.buttons.map((button, index) => (
                                <Link href={button.url} key={`${button.label}-${button.id ?? index}`} className="w-full sm:w-auto">
                                    <Button
                                        variant={button.variant ?? "normal"}
                                        onClick={() => trigger("heavy")}
                                        className={cn("w-full! text-base! z-10", button.variant === "filled" && "bg-white/80! hover:bg-white! text-primary!")}
                                    >
                                        {button.label}
                                    </Button>
                                </Link>
                            ))}
                        </motion.div>
                    </div>
                    <motion.div variants={staggerItem} className="h-auto w-full lg:w-4/5 lg:-mr-56">
                        <div className="relative overflow-hidden rounded-2xl lg:rounded-l-2xl lg:rounded-r-none">
                            <Image
                                src={"/code0_software.png"}
                                alt={"Code= Example"}
                                height={620}
                                width={900}
                                className={
                                    "rounded-2xl border border-white/10 shadow-[0_18px_50px_rgba(0,0,0,0.28)] lg:rounded-l-2xl lg:rounded-r-none lg:border-0 lg:border-l lg:border-y lg:ring-4 lg:ring-white/5"
                                }
                            />
                            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(15,12,31,0.18),transparent_30%,transparent_62%,rgba(15,12,31,0.5)_100%),radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_34%),linear-gradient(to_top,rgba(15,12,31,0.42),transparent_30%)]" />
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </Section>
    )
}
