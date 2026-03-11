"use client"

import { Section } from "@/components/ui/Section"
import { LinkButton } from "@/components/ui/LinkButton"
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
}

interface DeploymentSectionProps {
    content?: DeploymentSectionContent | null
}

export const DeploymentSection: React.FC<DeploymentSectionProps> = ({ content }) => {
    if (!content) return null

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
    ] as const

    return (
        <Section sectionType="DeploymentSection" funnelType="left" animationPreset="zoom-in" fullHeight>
            <div className="pointer-events-none absolute -inset-y-32 inset-x-0 opacity-20 blur-xl will-change-filter [background:radial-gradient(circle,rgba(114,201,248,0.5),transparent_70%)]" />

            <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-8">
                {deploymentCards.map((card) => (
                    <article
                        key={card.badge}
                        className="group rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.28)] transition-all duration-500 hover:-translate-y-1 hover:border-white/14 hover:shadow-[0_26px_80px_rgba(0,0,0,0.38)]"
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

                        <div className="px-2 pb-2 pt-6">
                            <h3 className="text-2xl font-semibold tracking-tight text-white">{card.title}</h3>
                            <p className="mt-3 max-w-xl text-base leading-7 text-white/75">{card.description}</p>
                            {card.link?.url && (
                                <LinkButton href={card.link.url} className="mt-5">
                                    {card.link.label}
                                </LinkButton>
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </Section>
    )
}
