"use client"

import { InteractiveGridPattern } from "@/components/InteractiveGridPattern"
import { Section } from "@/components/ui/Section"
import { cn } from "@/lib/utils"
import Image from "next/image"
import React from "react"
import Link from "next/link"
import { Button } from "@code0-tech/pictor"

interface CtaSectionContent {
    heading: string
    subheading: string
    ctaLink: {
        label: string
        url: string
    }
}

interface CtaSectionProps {
    content?: CtaSectionContent | null
}

export const CtaSection: React.FC<CtaSectionProps> = ({ content }) => {
    if (!content) return

    return (
        <Section showBlur={false} showFunnel={false} animationPreset="fade-in">
            <div className={"relative overflow-hidden w-full flex flex-col items-center justify-center gap-8 py-12 rounded-xl border border-white/5 shadow-md"}>

                <InteractiveGridPattern
                    className={cn("mask-[radial-gradient(600px_circle_at_center,white,transparent)]")}
                    width={42}
                    height={48}
                    squares={[50, 10]}
                />
                <div className="pointer-events-none absolute -inset-16 opacity-10 blur-xl will-change-filter [background:radial-gradient(circle,rgba(248,114,226,0.35),transparent_95%)]" />

                <div className={"z-20 size-31 border border-white/5 bg-white/5 backdrop-blur-lg flex items-center justify-center rounded-2xl"}>
                    <div className={"border border-white/10 bg-linear-to-br from-primary to-pink/5 flex items-center justify-center rounded-xl"}>
                        <Image src={"/code0_logo_white.png"} width={"112"} height={"112"} alt={"Code0 Logo"} className={"z-20"}/>
                    </div>
                </div>

                <p className={"z-20 text-2xl sm:text-4xl text-white text-center font-semibold"}>
                    {content.heading}
                </p>
                <p className={"w-4/5 sm:w-2/3 lg:w-1/2 z-20 text-md sm:text-lg text-white/75 text-center"}>
                    {content?.subheading}
                </p>

                <div className={"z-20 flex items-center gap-4"}>
                    <Link href={content.ctaLink.url}>
                        <Button variant="normal" className={"h-10 flex items-center gap-2 px-8! text-base! bg-white/80! hover:bg-white! text-primary!"}>
                            {content.ctaLink.label}
                        </Button>
                    </Link>
                </div>
            </div>
        </Section>
    )
}
