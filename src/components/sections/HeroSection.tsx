"use client"

import { Section } from "@/components/ui/Section"
import { cn } from "@/utils/cn"
import { Button } from "@code0-tech/pictor"
import { IconArrowRight } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"
import React from "react"
import Grainient from "../ui/Granient"

interface HeroSectionButton {
    label: string
    url: string
    variant?: "none" | "normal" | "outlined" | "filled" | null
    id?: string | null
}

interface HeroSectionText {
    text: string
    id?: string | null
}

interface HeroSectionContent {
    badge?: string | null
    heading?: string | null
    texts?: HeroSectionText[] | null
    buttons?: HeroSectionButton[] | null
}

interface HeroSectionProps {
    content?: HeroSectionContent | null
}

export const HeroSection: React.FC<HeroSectionProps> = ({ content }) => {
    if (!content || !content.texts || !content.buttons) return

    return (
        <Section showBlur={false} showFunnel={false}>

            <div className="relative h-[85vh] rounded-xl ring ring-white/5 overflow-hidden shadow-md">

                <div className="pointer-events-none absolute inset-0 -z-10 bg-[#0f0c1f]">
                    <Grainient
                        color1="#13102d"
                        color2="#f872e2"
                        color3="#7472f8"
                        timeSpeed={0.25}
                        colorBalance={0}
                        warpStrength={1}
                        warpFrequency={5}
                        warpSpeed={2}
                        warpAmplitude={50}
                        blendAngle={0}
                        blendSoftness={0.05}
                        rotationAmount={500}
                        noiseScale={2}
                        grainAmount={0.1}
                        grainScale={2}
                        grainAnimated={false}
                        contrast={1.5}
                        gamma={1}
                        saturation={1}
                        centerX={0}
                        centerY={0}
                        zoom={0.9}
                    />
                </div>

                <div className={"z-10 h-full flex flex-col md:flex-row items-center justify-between gap-12 px-8 md:px-16 py-12 md:py-24"}>

                    <div className="w-full md:w-2/5 flex flex-col gap-4 text-start">
                        <div className="relative z-10 group bg-brand/5 cursor-pointer border border-brand/5 text-brand w-fit px-4 py-0.5 rounded-full flex items-center justify-between gap-1 hover:gap-2 hover:pr-3 transition-all text-sm font-medium">
                            {content.badge}
                            <IconArrowRight size={14}/>
                        </div>

                        <h1 className="relative z-10 font-bold text-3xl md:text-4xl text-white text-balance">
                            {content.heading}
                        </h1>

                        <p className="relative z-10 font-medium text-white/75 text-lg md:text-xl text-balance">
                            {content.texts.length > 0
                                ? content.texts.map((item, index) => (
                                    <React.Fragment key={`${item.id ?? item.text}-${index}`}>
                                        {item.text}
                                        {index < content.texts!!.length - 1 && <br />}
                                    </React.Fragment>
                                ))
                                : <>Beschreibung1 <br /> Beschreibung2</>}
                        </p>

                        <div className={"flex flex-col gap-4 mt-4"}>
                            {content.buttons.map((button, index) => (
                                <Link href={button.url} key={`${button.label}-${button.id ?? index}`} className="w-full sm:w-auto">
                                    <Button
                                        variant={button.variant ?? "normal"}
                                        className={cn("w-full! text-base! z-10", button.variant === "filled" && "bg-white/80! hover:bg-white! text-primary!")}
                                    >
                                        {button.label}
                                    </Button>
                                </Link>
                            ))}
                        </div>
                    </div>
                    <Image src={"/code0_software.png"} alt={"Code= Example"} height={620} width={900} className={"w-full h-auto rounded-xl border border-white/10 md:w-4/5 md:border-0 md:border-l md:border-y md:rounded-l-xl md:rounded-r-none md:ring-4 md:ring-white/5 md:-mr-56"}/>
                </div>
            </div>
        </Section>
    )
}
