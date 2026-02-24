"use client"

import { Section } from "@/components/ui/Section"
import { LinkButton } from "@/components/ui/LinkButton"
import Image from "next/image"
import React from "react"

interface DeploymentSectionContent {
    cloudTitle: string
    cloudDescription: string
    cloudLink: {
        label: string
        url: string
    }
    selfhostTitle: string
    selfhostDescription: string
    selfhostLink: {
        label: string
        url: string
    }
}

interface DeploymentSectionProps {
    content?: DeploymentSectionContent | null
}

export const DeploymentSection: React.FC<DeploymentSectionProps> = ({ content }) => {
    if (!content) return null

    return (
        <Section sectionType="DeploymentSection" funnelType="left" fullHeight>
            <div className="pointer-events-none absolute -inset-y-32 inset-x-0 opacity-20 blur-xl will-change-filter [background:radial-gradient(circle,rgba(114,201,248,0.5),transparent_70%)]" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:8">
                <article>
                    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-md">
                        <div className="relative h-100 bg-primary/40">
                            <Image
                                src="/code0_software.png"
                                alt="Cloud deployment"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>
                    <div className="mt-5">
                        <h3 className="text-2xl font-semibold text-white">{content.cloudTitle}</h3>
                        <p className="mt-3 text-base text-white/75">{content.cloudDescription}</p>
                        {content.cloudLink?.url && (
                            <LinkButton href={content.cloudLink.url} className="mt-5">
                                {content.cloudLink.label}
                            </LinkButton>
                        )}
                    </div>
                </article>

                <article>
                    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-md">
                        <div className="relative h-100 bg-primary/40">
                        <Image
                            src="/code0_software.png"
                            alt="Self-hosted deployment"
                            fill
                            className="object-cover"
                        />
                    </div>
                    </div>
                    <div className="mt-5">
                        <h3 className="text-2xl font-semibold text-white">{content.selfhostTitle}</h3>
                        <p className="mt-3 text-base text-white/75">{content.selfhostDescription}</p>
                        {content.selfhostLink?.url && (
                            <LinkButton href={content.selfhostLink.url} className="mt-5">
                                {content.selfhostLink.label}
                            </LinkButton>
                        )}
                    </div>
                </article>
            </div>
        </Section>
    )
}
