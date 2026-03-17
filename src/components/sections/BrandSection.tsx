"use client"

import React from "react"
import { Section } from "@/components/ui/Section"
import Image from "next/image"
import type { Media } from "@/payload-types"
import { m as motion, type Variants } from "motion/react"

interface BrandSectionLogo {
    logo: number | Media
    id?: string | null
}

interface BrandSectionContent {
    description?: string | null
    logos?: BrandSectionLogo[] | null
}

interface BrandSectionProps {
    content?: BrandSectionContent | null
}

export const BrandSection: React.FC<BrandSectionProps> = ({ content }) => {
    if (!content) return

    const logos = (content.logos ?? [])
        .map((item) => item.logo)
        .filter((logo) => Boolean((logo as Media)?.url))

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
            transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
        },
    }

    return (
        <Section showBlur={false} showFunnel={false} animationPreset="slide-right">
            <motion.div
                className="w-full flex gap-8 px-8 md:px-16 pb-16 items-center justify-center"
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
            >
                <motion.p variants={staggerItem} className={"hidden lg:flex text-md text-white/75"}>
                    {content.description}
                </motion.p>
                <motion.div variants={staggerContainer} className={"w-full grid grid-cols-2 md:grid-cols-4 gap-16 text-white/75 text-center"}>
                    {logos.length > 0 ? (
                        logos.map((item, index) => {
                            const href = (item as Media & { href?: string | null }).href
                            const logo = item as Media

                            return (
                                <motion.div variants={staggerItem} className="relative w-full h-14" key={`${logo.id ?? logo.url ?? index}`}>
                                    {href ? (
                                        <a href={href} className="relative block h-full w-full">
                                            <Image
                                                src={logo.url ?? ""}
                                                alt={logo.alt}
                                                fill
                                                className="object-contain brightness-0 invert"
                                                sizes="(min-width: 768px) 20vw, 40vw"
                                            />
                                        </a>
                                    ) : (
                                        <Image
                                            src={logo.url ?? ""}
                                            alt={logo.alt}
                                            fill
                                            className="object-contain brightness-0 invert"
                                            sizes="(min-width: 768px) 20vw, 40vw"
                                        />
                                    )}
                                </motion.div>
                            )
                        })
                    ) : (
                        <>
                            <motion.p variants={staggerItem} className={"text-4xl font-bold"}>Logo1</motion.p>
                            <motion.p variants={staggerItem} className={"text-4xl font-bold"}>Logo2</motion.p>
                            <motion.p variants={staggerItem} className={"text-4xl font-bold"}>Logo3</motion.p>
                            <motion.p variants={staggerItem} className={"text-4xl font-bold"}>Logo4</motion.p>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </Section>
    )
}
