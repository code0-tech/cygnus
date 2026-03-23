"use client"

import { LinkButton } from "@/components/ui/LinkButton"
import { Section } from "@/components/ui/Section"
import { ANIMATION_PRESETS, type AnimationPreset } from "@/lib/utils"
import type { Media } from "@/payload-types"
import { m as motion, type Variants } from "motion/react"
import Image from "next/image"
import React from "react"

interface UseCaseItem {
    label: string
    title: string
    description: string
    image?: Media | number | null
    bulletPoints: string[]
    link?: {
        label?: string | null
        url?: string | null
    } | null
    id?: string | null
}

interface UseCaseSectionContent {
    useCases: UseCaseItem[] | null
}

interface UseCaseSectionProps {
    content?: UseCaseSectionContent | null
}

const USE_CASE_ANIMATION_SEQUENCE: Exclude<AnimationPreset, "none">[] = [
    "slide-left",
    "slide-right",
    "slide-left"
]

export const UseCaseSection: React.FC<UseCaseSectionProps> = ({ content }) => {
    if (!content?.useCases?.length) return null

    const staggerContainer: Variants = {
        hidden: {},
        show: {
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.06,
            },
        },
    }

    const staggerItem: Variants = {
        hidden: { opacity: 0, y: 14 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.38,
                ease: [0.22, 1, 0.36, 1],
            },
        },
    }

    return (
        <Section sectionType="UseCaseSection" showBlur={false} animationPreset="none">
            <div className="relative w-full flex flex-col items-stretch gap-32">
                {content.useCases.map((item, index) => {
                    const animationPreset = USE_CASE_ANIMATION_SEQUENCE[index % USE_CASE_ANIMATION_SEQUENCE.length]
                    const animationConfig = ANIMATION_PRESETS[animationPreset]
                    const image = typeof item.image === "object" ? item.image : null

                    return (
                        <motion.div
                            key={item.id ?? item.label}
                            className={`w-full flex flex-col items-center gap-8 ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                            initial={animationConfig.initial}
                            whileInView={animationConfig.whileInView}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{
                                ...animationConfig.transition,
                                delay: index * 0.08,
                            }}
                        >
                            <motion.div
                                className="mt-4 hidden w-1/2 px-2 pb-2 text-center md:block md:text-left"
                                variants={staggerContainer}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true, amount: 0.35 }}
                            >
                                <motion.p variants={staggerItem} className="text-xl font-semibold text-white md:text-3xl">{item.title}</motion.p>
                                <motion.p variants={staggerItem} className="mt-3 max-w-xl text-sm leading-7 text-white/75 md:text-base">{item.description}</motion.p>
                                {item.bulletPoints?.length ? (
                                    <motion.ul variants={staggerItem} className="mt-5 space-y-2.5 text-sm text-white/80 md:text-base">
                                        {item.bulletPoints.map((point, pointIndex) => (
                                            <li key={`${item.id ?? item.label}-point-${pointIndex}`} className="flex items-center gap-2">
                                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                                                <span>{point}</span>
                                            </li>
                                        ))}
                                    </motion.ul>
                                ) : null}
                                {item.link?.label && item.link?.url ? (
                                    <motion.div variants={staggerItem} className="mt-5">
                                        <LinkButton href={item.link.url}>
                                            {item.link.label}
                                        </LinkButton>
                                    </motion.div>
                                ) : null}
                            </motion.div>
                            <div className="relative w-full md:w-2/3">
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -inset-x-12 -inset-y-10 -z-10 rounded-4xl [background:radial-gradient(ellipse_at_center,rgba(122,203,255,0.16)_0%,rgba(122,203,255,0.08)_28%,rgba(122,203,255,0.03)_48%,transparent_76%)]"
                                />
                                <div className="relative z-10 h-112 overflow-hidden rounded-3xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] shadow-[0_12px_40px_rgba(0,0,0,0.18)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-white/18 before:to-transparent before:content-['']">
                                    {image?.url ? (
                                        <Image
                                            src={image.url}
                                            alt={image.alt ?? item.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : null}
                                </div>
                            </div>
                            <motion.div
                                className="w-full px-2 pb-2 text-left md:hidden md:text-center"
                                variants={staggerContainer}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true, amount: 0.35 }}
                            >
                                <motion.p variants={staggerItem} className="text-xl font-semibold tracking-tight text-white">{item.title}</motion.p>
                                <motion.p variants={staggerItem} className="mt-3 text-sm leading-7 text-white/75">{item.description}</motion.p>
                                {item.bulletPoints?.length ? (
                                    <motion.ul variants={staggerItem} className="mt-5 space-y-2.5 text-left text-sm text-white/80">
                                        {item.bulletPoints.map((point, pointIndex) => (
                                            <li key={`${item.id ?? item.label}-mobile-point-${pointIndex}`} className="flex items-start gap-3">
                                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                                                <span>{point}</span>
                                            </li>
                                        ))}
                                    </motion.ul>
                                ) : null}
                                {item.link?.label && item.link?.url ? (
                                    <motion.div variants={staggerItem} className="mt-5">
                                        <LinkButton href={item.link.url}>
                                            {item.link.label}
                                        </LinkButton>
                                    </motion.div>
                                ) : null}
                            </motion.div>
                        </motion.div>
                    )
                })}
            </div>
        </Section>
    )
}
