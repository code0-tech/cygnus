"use client"

import { LinkButton } from "@/components/ui/LinkButton"
import { Section } from "@/components/ui/Section"
import { OffsetCardsLayoutBlock } from "@/lib/cms"
import { getMediaUrl } from "@/lib/media"
import { ANIMATION_PRESETS, type AnimationPreset } from "@/lib/utils"
import type { Media } from "@/payload-types"
import { m as motion, type Variants } from "motion/react"
import Image from "next/image"
import React from "react"

interface OffsetCardsSectionProps {
    content?: OffsetCardsLayoutBlock | null
}

const OFFSET_CARD_ANIMATION_SEQUENCE: Exclude<AnimationPreset, "none">[] = [
    "slide-left",
    "slide-right",
    "slide-left",
]

const OFFSET_CARD_TONE_STYLES = [
    {
        surface: "bg-[radial-gradient(circle_at_top_left,rgba(122,203,255,0.05),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.008)_24%,rgba(10,12,24,0.58)_100%)]",
    },
    {
        surface: "bg-[radial-gradient(circle_at_top_right,rgba(145,232,120,0.05),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.008)_24%,rgba(10,12,24,0.58)_100%)]",
    },
    {
        surface: "bg-[radial-gradient(circle_at_bottom_left,rgba(132,188,255,0.05),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.008)_24%,rgba(10,12,24,0.58)_100%)]",
    },
] as const

export function OffsetCardsSection({ content }: OffsetCardsSectionProps) {
    if (!content?.cards?.length) return null

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
        <Section
            heading={content.sectionHeading}
            description={content.sectionDescription}
            linkButton={content.sectionLinkButton}
            showBlur={false}
            animationPreset="none"
        >
            <div className="relative flex w-full flex-col items-stretch gap-32">
                {content.cards.map((item, index) => {
                    const animationPreset = OFFSET_CARD_ANIMATION_SEQUENCE[index % OFFSET_CARD_ANIMATION_SEQUENCE.length]
                    const animationConfig = ANIMATION_PRESETS[animationPreset]
                    const image = item.image as Media
                    const imageUrl = getMediaUrl(image?.url)
                    const toneStyle = OFFSET_CARD_TONE_STYLES[index % OFFSET_CARD_TONE_STYLES.length]

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
                            <div className={`relative aspect-video w-full overflow-hidden rounded-[2.1rem] border border-white/6 shadow-[0_24px_64px_rgba(0,0,0,0.16)] lg:w-2/3 ${toneStyle.surface}`}>
                                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/18 to-transparent" />
                                <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,transparent_40%,rgba(7,10,20,0.12)_100%)]" />
                                {imageUrl ? (
                                    <Image
                                        src={imageUrl}
                                        alt={image.alt ?? item.title}
                                        fill
                                        sizes="(min-width: 768px) 66vw, 100vw"
                                        className="object-contain drop-shadow-[0_16px_36px_rgba(0,0,0,0.16)]"
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
