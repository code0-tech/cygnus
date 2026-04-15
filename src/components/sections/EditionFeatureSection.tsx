"use client"

import { LinkButton } from "@/components/ui/LinkButton"
import { Section } from "@/components/ui/Section"
import type { EditionFeaturesLayoutBlock } from "@/lib/cms"
import { ANIMATION_PRESETS, type AnimationPreset } from "@/lib/utils"
import type { Media } from "@/payload-types"
import { m as motion, type Variants } from "motion/react"
import Image from "next/image"
import React from "react"

interface EditionFeatureSectionProps {
    content?: EditionFeaturesLayoutBlock | null
}

const EDITION_FEATURE_ANIMATION_SEQUENCE: Exclude<AnimationPreset, "none">[] = [
    "slide-left",
    "slide-right",
    "slide-left",
]

export const EditionFeatureSection: React.FC<EditionFeatureSectionProps> = ({ content }) => {
    if (!content?.features?.length) return null

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
        <Section showBlur={false} showFunnel={false} animationPreset="none">
            <div className="relative flex w-full flex-col items-stretch gap-32">
                {content.features.map((item, index) => {
                    const animationPreset = EDITION_FEATURE_ANIMATION_SEQUENCE[index % EDITION_FEATURE_ANIMATION_SEQUENCE.length]
                    const animationConfig = ANIMATION_PRESETS[animationPreset]
                    const image = item.image as Media

                    return (
                        <motion.div
                            key={item.id ?? item.label}
                            className={`flex w-full flex-col items-center gap-8 ${index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"}`}
                            initial={animationConfig.initial}
                            whileInView={animationConfig.whileInView}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{
                                ...animationConfig.transition,
                                delay: index * 0.08,
                            }}
                        >
                            <motion.div
                                className="mt-4 hidden w-1/2 px-2 pb-2 text-center lg:block lg:text-left"
                                variants={staggerContainer}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true, amount: 0.35 }}
                            >
                                <motion.p variants={staggerItem} className="text-xl font-semibold text-white lg:text-3xl">{item.title}</motion.p>
                                <motion.p variants={staggerItem} className="mt-3 max-w-xl text-sm leading-7 text-white/75 lg:text-base">{item.description}</motion.p>
                                {item.bulletPoints?.length ? (
                                    <motion.ul variants={staggerItem} className="mt-5 space-y-2.5 text-sm text-white/80 lg:text-base">
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
                            <div className="glass-card-shell aspect-video w-full lg:w-2/3">
                                <div aria-hidden="true" className="glass-card-topline" />
                                {image?.url ? (
                                    <Image
                                        src={image.url}
                                        alt={image.alt ?? item.title}
                                        fill
                                        sizes="(min-width: 768px) 66vw, 100vw"
                                        className="object-contain"
                                    />
                                ) : null}
                            </div>
                            <motion.div
                                className="w-full px-2 pb-2 text-left lg:hidden lg:text-center"
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
