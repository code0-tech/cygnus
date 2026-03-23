"use client"

import { Section } from "@/components/ui/Section"
import { LinkButton } from "@/components/ui/LinkButton"
import { m as motion, type Variants } from "motion/react"
import React from "react"
import { DeploymentImage } from "../DeploymentImage"

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
            title: content.cloudTitle,
            description: content.cloudDescription,
            link: content.cloudLink,
            imageColor: "aqua",
            imageIcon: "cloud",
            imageText: "Cloud",
        },
        {
            badge: "Self-hosted",
            title: content.selfhostTitle,
            description: content.selfhostDescription,
            link: content.selfhostLink,
            imageColor: "pink",
            imageIcon: "server",
            imageText: "Selfhost",
        },
        {
            badge: "Dynamic",
            title: content.dynamicTitle,
            description: content.dynamicDescription,
            link: content.dynamicLink,
            imageColor: "brand",
            imageIcon: "cloud-computing",
            imageText: "Dynamic",
        },
    ] as const

    return (
        <Section sectionType="DeploymentSection" funnelType="left" animationPreset="zoom-in" fullHeight className="h-auto md:h-auto lg:h-[min(100dvh,1080px)]">
            <div className="pointer-events-none absolute -bottom-40 top-0 inset-x-0 [background:radial-gradient(circle,rgba(114,201,248,0.1),transparent_60%)]" />

            <motion.div
                className="grid grid-cols-1 gap-16 lg:grid-cols-3 lg:gap-8 z-10"
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
            >
                {deploymentCards.map((card) => (
                    <motion.article
                        key={card.badge}
                        variants={staggerItem}
                        className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/8 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_28%,rgba(8,10,20,0.92)_100%)] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.28)] transition-transform before:pointer-events-none before:absolute before:inset-1px before:rounded-[calc(1.75rem-1px)] before:border before:border-white/6 before:content-[''] after:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-linear-to-r after:from-transparent after:via-white/30 after:to-transparent after:content-['']"
                    >
                        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-aqua/5 via-blue/5 to-transparent opacity-60" />

                        <DeploymentImage color={card.imageColor} icon={card.imageIcon} text={card.imageText} />
                        <div className="relative z-10 flex h-full flex-1 flex-col px-2 pb-2 pt-4">
                            <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                            <p className="mt-2 text-sm text-white/75">{card.description}</p>
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
