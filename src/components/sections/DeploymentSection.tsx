"use client"

import { Section } from "@/components/ui/Section"
import { LinkButton } from "@/components/ui/LinkButton"
import { m as motion, type Variants } from "motion/react"
import Image from "next/image"
import React from "react"

interface DeploymentSectionContent {
    cloudTitle?: string | null
    cloudDescription?: string | null
    cloudLink?: {
        label?: string | null
        url?: string | null
    }
    selfhostTitle?: string | null
    selfhostDescription?: string | null
    selfhostLink?: {
        label?: string | null
        url?: string | null
    }
    dynamicTitle?: string | null
    dynamicDescription?: string | null
    dynamicLink?: {
        label?: string | null
        url?: string | null
    }
}

interface DeploymentSectionProps {
    content?: DeploymentSectionContent | null
}

export const DeploymentSection: React.FC<DeploymentSectionProps> = ({ content }) => {
    if (!content) return null

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

    const deploymentCards = [
        {
            badge: "Cloud",
            alt: "Cloud deployment",
            title: content.cloudTitle,
            description: content.cloudDescription,
            link: content.cloudLink,
            glowClass: "from-aqua/24 via-blue/10 to-primary/70",
            badgeClass: "border-aqua/25 bg-aqua/12 text-aqua",
        },
        {
            badge: "Self-hosted",
            alt: "Self-hosted deployment",
            title: content.selfhostTitle,
            description: content.selfhostDescription,
            link: content.selfhostLink,
            glowClass: "from-pink/20 via-blue/10 to-primary/70",
            badgeClass: "border-pink/25 bg-pink/12 text-pink",
        },
        {
            badge: "Dynamic",
            alt: "Dynamic deployment",
            title: content.dynamicTitle,
            description: content.dynamicDescription,
            link: content.dynamicLink,
            glowClass: "from-brand/24 via-aqua/10 to-primary/70",
            badgeClass: "border-brand/25 bg-brand/12 text-brand",
        },
    ] as const

    return (
        <Section sectionType="DeploymentSection" funnelType="left" animationPreset="zoom-in" fullHeight className="h-auto md:h-auto lg:h-dvh">
            <div className="pointer-events-none absolute -inset-y-32 inset-x-0 opacity-20 blur-xl [background:radial-gradient(circle,rgba(114,201,248,0.5),transparent_70%)]" />

            <motion.div
                className="grid grid-cols-1 gap-16 lg:grid-cols-3 lg:gap-8"
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
            >
                {deploymentCards.map((card) => (
                    <motion.article
                        key={card.badge}
                        variants={staggerItem}
                        className="group flex h-full flex-col rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.28)] transition-[transform,border-color] duration-500 hover:border-white/14"
                    >
                        <div className="relative overflow-hidden rounded-[1.2rem] border border-white/8 bg-primary/40">
                            <div className={`pointer-events-none absolute inset-0 z-10 bg-linear-to-br ${card.glowClass}`} />
                            <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_32%)]" />
                            <div className="relative h-100">
                                <Image
                                    src="/code0_software.png"
                                    alt={card.alt}
                                    fill
                                    className="object-cover transition-transform duration-700"
                                />
                            </div>
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-linear-to-t from-primary via-primary/70 to-transparent" />
                        </div>

                        <div className="flex h-full flex-1 flex-col px-2 pb-2 pt-6">
                            <h3 className="text-2xl font-semibold tracking-tight text-white">{card.title}</h3>
                            <p className="mt-2 max-w-xl text-base leading-7 text-white/75">{card.description}</p>
                            {card.link?.url && (
                                <LinkButton href={card.link.url} className="mt-auto pt-4">
                                    {card.link.label}
                                </LinkButton>
                            )}
                        </div>
                    </motion.article>
                ))}
            </motion.div>
        </Section>
    )
}
