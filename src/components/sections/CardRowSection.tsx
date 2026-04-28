"use client"

import { LinkButton } from "@/components/ui/LinkButton"
import { Section } from "@/components/ui/Section"
import type { Media } from "@/payload-types"
import { m as motion, type Variants } from "motion/react"
import Image from "next/image"
import React, { Children, type ReactNode } from "react"

interface CardRowCard {
    title?: string | null
    description?: string | null
    link?: {
        label?: string | null
        url?: string | null
    } | null
    image?: number | Media | null
    id?: string | null
}

interface CardRowSectionContent {
    cards?: CardRowCard[] | null
}

interface CardRowSectionProps {
    content?: CardRowSectionContent | null
    children?: ReactNode
}

function getImageUrl(image: CardRowCard["image"]) {
    return typeof image === "object" && image?.url ? image.url : null
}

export const CardRowSection: React.FC<CardRowSectionProps> = ({ content, children }) => {
    const cards = content?.cards?.filter((card) => Boolean(card.title)) ?? []
    const fallbackImages = Children.toArray(children)
    if (cards.length === 0) return null

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
        hidden: { opacity: 0, y: 20 },
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
        <Section sectionType="CardRowSection" funnelType="left" animationPreset="zoom-in">
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -top-16 inset-x-0 [background:radial-gradient(circle,rgba(114,201,248,0.1),transparent_50%)]" />

            <motion.div
                className="grid grid-cols-1 gap-16 lg:grid-cols-3 lg:gap-8 z-10"
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
            >
                {cards.map((card, index) => {
                    const mediaImage = typeof card.image === "object" ? card.image : null
                    const imageUrl = getImageUrl(card.image)
                    const fallbackImage = fallbackImages[index]

                    return (
                        <motion.article
                            key={card.id ?? `${card.title}-${index}`}
                            variants={staggerItem}
                            className="glass-card-shell group flex h-full flex-col rounded-[1.75rem] p-2 shadow-[0_18px_60px_rgba(0,0,0,0.28)] transition-transform before:pointer-events-none before:absolute before:inset-1px before:rounded-[calc(1.75rem-1px)] before:border before:border-white/6 before:content-['']"
                        >
                            <div aria-hidden="true" className="glass-card-topline" />

                            {imageUrl ? (
                                <div className="relative aspect-[243.476/160] overflow-hidden rounded-[1.2rem] border border-white/8 bg-primary/40">
                                    <Image
                                        src={imageUrl}
                                        alt={mediaImage?.alt ?? card.title ?? ""}
                                        fill
                                        sizes="(min-width: 1024px) 33vw, 100vw"
                                        className="object-cover"
                                    />
                                </div>
                            ) : fallbackImage}

                            <div className="relative z-10 flex h-full flex-1 flex-col px-2 pb-2 pt-4">
                                <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                                {card.description && <p className="mt-2 text-sm text-white/75">{card.description}</p>}
                                {card.link?.url && (
                                    <LinkButton href={card.link.url} className="mt-auto pt-4">
                                        {card.link.label}
                                    </LinkButton>
                                )}
                            </div>
                        </motion.article>
                    )
                })}
            </motion.div>
        </Section>
    )
}
