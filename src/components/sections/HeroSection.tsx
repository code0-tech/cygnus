"use client"

import { Section } from "@/components/ui/Section"
import { cn } from "@/lib/utils"
import { IconArrowRight } from "@tabler/icons-react"
import { m as motion, type Variants } from "motion/react"
import Image from "next/image"
import Link from "next/link"
import React from "react"
import Grainient from "../ui/Granient"
import { HapticButtonLink } from "../ui/HapticButtonLink"
import { StableBadge } from "../ui/StableBadge"

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
    badge_link?: string | null
    heading?: string | null
    texts?: HeroSectionText[] | null
    buttons?: HeroSectionButton[] | null
}

interface HeroSectionProps {
    content?: HeroSectionContent | null
}

export const HeroSection: React.FC<HeroSectionProps> = ({ content }) => {
    const [isProductHuntBadgeVisible, setIsProductHuntBadgeVisible] = React.useState(false)

    if (!content || !content.texts || !content.buttons) return

    const staggerContainer: Variants = {
        hidden: {},
        show: {
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0,
            },
        },
    }

    const staggerItem: Variants = {
        hidden: { opacity: 0, y: 12 },
        show: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
        },
    }

    return (
        <Section showBlur={false} showFunnel={false}>
            <div className="glass-card-shell relative isolate h-[min(85svh,918px)] md:h-[min(85dvh,918px)] rounded-4xl bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]! shadow-[0_24px_80px_rgba(0,0,0,0.34)]!">

                <a
                    href="https://www.producthunt.com/products/codezero?embed=true&amp;utm_source=badge-featured&amp;utm_medium=badge&amp;utm_campaign=badge-codezero-2"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-hidden={!isProductHuntBadgeVisible}
                    className={cn(!isProductHuntBadgeVisible && "pointer-events-none opacity-0")}
                >
                    <img
                        alt="CodeZero - An open source no-code automation builder | Product Hunt"
                        width="200"
                        height="54"
                        className="absolute left-1/2 lg:left-auto md:right-4 -translate-x-1/2 lg:translate-0 bottom-4 z-100"
                        src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1125393&amp;theme=dark&amp;t=1776350762444"
                        onLoad={() => setIsProductHuntBadgeVisible(true)}
                        onError={() => setIsProductHuntBadgeVisible(false)}
                    />
                </a>


                <Grainient />
                <motion.div
                    className={"relative z-20 flex h-full flex-col items-center justify-between gap-8 rounded-[calc(1.9rem-1px)] p-8 lg:flex-row lg:p-16"}
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.25 }}
                >
                    <div className="w-full lg:w-2/5 flex flex-col gap-4 text-start">
                        <motion.div variants={staggerItem}>
                            <Link href={content.badge_link ?? ""}>
                                <StableBadge className="group relative z-10 text-xs px-3 cursor-pointer" color="info">
                                    {content.badge}
                                    <IconArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                                </StableBadge>
                            </Link>
                        </motion.div>

                        <motion.h1 variants={staggerItem} className="relative z-10 font-bold text-3xl lg:text-4xl text-white text-balance">
                            {content.heading}
                        </motion.h1>

                        <motion.p variants={staggerItem} className="relative z-10 font-medium text-white/75 text-base lg:text-xl text-pretty">
                            {content.texts.length > 0
                                ? content.texts.map((item, index) => (
                                    <React.Fragment key={`${item.id ?? item.text}-${index}`}>
                                        {item.text}
                                        {index < content.texts!!.length - 1 && <br />}
                                    </React.Fragment>
                                ))
                                : <>Beschreibung1 <br /> Beschreibung2</>}
                        </motion.p>

                        <motion.div variants={staggerItem} className={"flex flex-col gap-2 sm:gap-4 mt-4"}>
                            {content.buttons.map((button, index) => (
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
                        <div className="relative overflow-hidden rounded-2xl lg:rounded-l-2xl lg:rounded-r-none">
                            <Image
                                src={"/code0_software.png"}
                                alt={"Code= Example"}
                                height={620}
                                width={900}
                                priority
                                fetchPriority="high"
                                sizes="(min-width: 1024px) 60vw, 100vw"
                                className="rounded-2xl border border-white/10 shadow-[0_14px_38px_rgba(0,0,0,0.24)] lg:rounded-l-2xl lg:rounded-r-none lg:border-0 lg:border-l lg:border-y lg:ring-4 lg:ring-white/5"
                            />
                        </div>
                    </div>
                </motion.div>
            </div>
        </Section>
    )
}
