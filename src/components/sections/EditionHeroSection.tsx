"use client"

import { Section } from "@/components/ui/Section"
import type { EditionHeroLayoutBlock } from "@/lib/cms"
import { cn } from "@/lib/utils"
import { m as motion, type Variants } from "motion/react"
import Image from "next/image"
import React from "react"
import Grainient from "../ui/Granient"
import { HapticButtonLink } from "../ui/HapticButtonLink"

type EditionHeroSectionProps = {
    content?: EditionHeroLayoutBlock | null
    imageSrc?: string
    locale: "en" | "de"
    grainientColors?: {
        color1: string
        color2: string
        color3: string
        backgroundColor?: string
    }
}

export function EditionHeroSection({
    content,
    imageSrc = "/code0_software.png",
    locale,
    grainientColors,
}: EditionHeroSectionProps) {
    if (!content?.heading || !content?.imageAlt) return null

    const texts = content.texts?.map((item) => item.text).filter(Boolean) ?? []
    const buttons = content.buttons?.filter((button) => Boolean(button.label && button.url)) ?? []

    const staggerContainer: Variants = {
        hidden: {},
        show: {
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0,
            },
        },
    }

    const staggerItem: Variants = {
        hidden: { opacity: 0, y: 12 },
        show: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
        },
    }

    return (
        <Section showBlur={false} showFunnel={false}>
            <div className="glass-card-shell relative isolate h-[min(85svh,918px)] md:h-[min(85dvh,918px)] rounded-4xl bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]! shadow-[0_24px_80px_rgba(0,0,0,0.34)]!">
                <Grainient {...grainientColors} />

                <motion.div
                    className="relative z-20 flex flex-col items-center justify-center gap-10 p-8 lg:p-16"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.25 }}
                >
                    <div className="flex w-full max-w-6xl flex-col items-center gap-4">
                        <motion.h1 variants={staggerItem} className="relative z-10 text-balance text-3xl font-bold text-white lg:text-5xl text-center">
                            {content.heading}
                        </motion.h1>

                        <motion.p variants={staggerItem} className="relative z-10 max-w-2xl text-base font-medium text-pretty text-white/75 lg:text-xl text-center">
                            {texts.map((text, index) => (
                                <React.Fragment key={`${text}-${index}`}>
                                    {text}
                                    {index < texts.length - 1 && <br />}
                                </React.Fragment>
                            ))}
                        </motion.p>

                        <motion.div variants={staggerItem} className="mt-4 flex w-full flex-col items-center gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-4">
                            {buttons.map((button, index) => (
                                <HapticButtonLink
                                    href={button.url}
                                    key={`${button.label}-${index}`}
                                    variant={button.variant ?? "normal"}
                                    className={cn(button.variant === "filled" && "bg-white/80! text-primary! hover:bg-white!")}
                                >
                                    {button.label}
                                </HapticButtonLink>
                            ))}
                        </motion.div>
                    </div>

                    <div className="w-full max-w-6xl">
                        <div className="relative overflow-hidden rounded-2xl">
                            <Image
                                src={imageSrc}
                                alt={content.imageAlt}
                                height={620}
                                width={1200}
                                priority
                                fetchPriority="high"
                                sizes="(min-width: 1024px) 72rem, 100vw"
                                className="rounded-2xl border border-white/10 shadow-[0_14px_38px_rgba(0,0,0,0.24)] ring-4 ring-white/5"
                            />
                        </div>
                    </div>
                </motion.div>
            </div>
        </Section>
    )
}
