"use client"

import { Section } from "@/components/ui/Section"
import { cn } from "@/lib/utils"
import { IconArrowRight } from "@tabler/icons-react"
import { m as motion, type Variants } from "motion/react"
import Image from "next/image"
import Link from "next/link"
import React, { useState } from "react"
import Grainient from "../ui/Granient"
import { HapticButtonLink } from "../ui/HapticButtonLink"
import { StableBadge } from "../ui/StableBadge"
import { HeroLayoutBlock } from "@/lib/cms"

interface HeroSectionProps {
    content?: HeroLayoutBlock | null
    imageSrc?: string
}

const STAGGER_CONTAINER: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0 } },
}
const STAGGER_ITEM: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
}

export function HeroSection({ content, imageSrc = "/code0_software.png" }: HeroSectionProps) {
    const [isProductHuntBadgeVisible, setIsProductHuntBadgeVisible] = useState(false)

    if (!content?.heading) return

    const texts = content.texts?.flatMap((item) => (item.text ? [item.text] : [])) ?? []
    const buttons = content.buttons?.filter((button) => Boolean(button.label && button.url)) ?? []
    const centered = Boolean(content.centered)
    const grainientColors = {
        color1: content.grainientColors?.color1 ?? undefined,
        color2: content.grainientColors?.color2 ?? undefined,
        color3: content.grainientColors?.color3 ?? undefined,
        backgroundColor: content.grainientColors?.backgroundColor ?? undefined,
    }

    if (centered) {
        return (
            <Section showFunnel={false}>
                <div className="relative overflow-hidden border border-white/5 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_28%,rgba(8,10,20,0.92)_100%)] isolate h-[min(85svh,918px)] md:h-[min(85dvh,918px)] rounded-4xl">
                    <Grainient {...grainientColors} />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-full bg-[radial-gradient(circle_at_18%_24%,rgba(5,8,18,0.68),transparent_40%),linear-gradient(90deg,rgba(5,8,18,0.56)_0%,rgba(5,8,18,0.28)_34%,transparent_62%)] lg:w-[56%]"
                    />
                    <motion.div
                        className="relative z-20 flex flex-col items-center justify-center gap-10 p-8 lg:p-16"
                        variants={STAGGER_CONTAINER}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.25 }}
                    >
                        <div className="flex w-full max-w-6xl flex-col items-center gap-4">
                            <motion.h1 variants={STAGGER_ITEM} className="relative z-10 text-balance text-3xl font-bold text-white lg:text-5xl text-center">
                                {content.heading}
                            </motion.h1>

                            <motion.p variants={STAGGER_ITEM} className="relative z-10 max-w-2xl text-base font-medium text-pretty text-secondary lg:text-xl text-center">
                                {texts.map((text, index) => (
                                    <React.Fragment key={`${text}-${index}`}>
                                        {text}
                                        {index < texts.length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                            </motion.p>

                            <motion.div variants={STAGGER_ITEM} className="mt-4 flex w-full flex-col items-center gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-4">
                                {buttons.map((button, index) => (
                                    <HapticButtonLink
                                        href={button.url}
                                        key={`${button.label}-${button.id ?? index}`}
                                        variant={button.variant ?? "normal"}
                                        className={cn(button.variant === "filled" && "bg-white/80! text-primary! hover:bg-white!")}
                                    >
                                        {button.label}
                                    </HapticButtonLink>
                                ))}
                            </motion.div>
                        </div>

                        <div className="w-full max-w-6xl">
                            <div className="rounded-[1.3rem] border border-white/20 bg-white/10 p-1">
                                <div className="relative overflow-hidden rounded-2xl">
                                    <Image
                                        src={imageSrc}
                                        alt={content.heading}
                                        height={620}
                                        width={1200}
                                        priority
                                        fetchPriority="high"
                                        sizes="(min-width: 1024px) 72rem, 100vw"
                                        className="block rounded-2xl"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </Section>
        )
    }

    return (
        <Section showFunnel={false}>
            <div className="relative overflow-hidden border border-white/5 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_28%,rgba(8,10,20,0.92)_100%)] isolate h-[min(85svh,918px)] md:h-[min(85dvh,918px)] rounded-4xl">
                <a
                    href="https://www.producthunt.com/products/codezero?embed=true&amp;utm_source=badge-featured&amp;utm_medium=badge&amp;utm_campaign=badge-codezero-2"
                    target="_blank"
                    rel="noopener noreferrer"
                    inert={!isProductHuntBadgeVisible}
                    className={cn(!isProductHuntBadgeVisible && "pointer-events-none opacity-0")}
                >
                    <img
                        alt="CodeZero - An open source no-code automation builder | Product Hunt"
                        width="200"
                        height="54"
                        className="absolute bottom-4 left-1/2 z-50 -translate-x-1/2 md:right-4 lg:left-auto lg:translate-0"
                        src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1125393&amp;theme=dark&amp;t=1776350762444"
                        onLoad={() => setIsProductHuntBadgeVisible(true)}
                        onError={() => setIsProductHuntBadgeVisible(false)}
                    />
                </a>

                <Grainient />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-0 z-10 w-full bg-[radial-gradient(circle_at_18%_24%,rgba(5,8,18,0.68),transparent_40%),linear-gradient(90deg,rgba(5,8,18,0.56)_0%,rgba(5,8,18,0.28)_34%,transparent_62%)] lg:w-[56%]"
                />

                <motion.div
                    className={"relative z-20 flex h-full flex-col items-center justify-between gap-8 rounded-3xl p-8 lg:flex-row lg:p-16"}
                    variants={STAGGER_CONTAINER}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.25 }}
                >
                    <div className="w-full lg:w-2/5 flex flex-col gap-4 text-start">
                        <motion.div variants={STAGGER_ITEM}>
                            <Link href={content.badge_link ?? ""}>
                                <StableBadge className="group relative z-10 text-xs px-3 cursor-pointer" color="info">
                                    {content.badge}
                                    <IconArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </StableBadge>
                            </Link>
                        </motion.div>

                        <motion.h1 variants={STAGGER_ITEM} className="relative z-10 font-bold text-3xl lg:text-4xl text-white text-balance">
                            {content.heading}
                        </motion.h1>

                        <motion.p variants={STAGGER_ITEM} className="relative z-10 font-medium text-white text-base lg:text-xl text-pretty">
                            {texts.length > 0 &&
                                texts.map((text, index) => (
                                    <React.Fragment key={`${text}-${index}`}>
                                        {text}
                                        {index < texts.length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                        </motion.p>

                        <motion.div variants={STAGGER_ITEM} className={"flex flex-col gap-2 sm:gap-4 mt-4"}>
                            {buttons.map((button, index) => (
                                <HapticButtonLink
                                    href={button.url}
                                    key={`${button.label}-${button.id ?? index}`}
                                    variant={button.variant ?? "normal"}
                                    className={cn(button.variant === "filled" && "bg-white/80! hover:bg-white! text-primary!")}
                                >
                                    {button.label}
                                </HapticButtonLink>
                            ))}
                        </motion.div>
                    </div>
                    <div className="h-auto w-full lg:w-4/5 lg:-mr-56">
                        <div className="rounded-[1.3rem] border border-white/20 bg-white/10 p-1 lg:rounded-l-[1.3rem] lg:rounded-r-none">
                            <div className="relative overflow-hidden rounded-2xl lg:rounded-l-2xl lg:rounded-r-none">
                                <Image
                                    src={imageSrc}
                                    alt={"Code0 Example"}
                                    height={620}
                                    width={900}
                                    priority
                                    fetchPriority="high"
                                    sizes="(min-width: 1024px) 60vw, 100vw"
                                    className="block rounded-2xl lg:rounded-l-2xl lg:rounded-r-none"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </Section>
    )
}
