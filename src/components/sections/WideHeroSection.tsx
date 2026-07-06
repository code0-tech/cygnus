"use client"

import { Section } from "@/components/ui/Section"
import { StableBadge } from "@/components/ui/StableBadge"
import { HapticButtonLink } from "@/components/ui/HapticButtonLink"
import type { WideHeroLayoutBlock } from "@/lib/cms"
import { getMediaUrl } from "@/lib/media"
import { cn } from "@/lib/utils"
import type { Media } from "@/payload-types"
import { IconArrowRight } from "@tabler/icons-react"
import { m as motion, type Variants } from "motion/react"
import Image from "next/image"
import Link from "next/link"
import { Fragment } from "react"

interface WideHeroSectionProps {
    content?: WideHeroLayoutBlock | null
}

const STAGGER_CONTAINER: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
}

const STAGGER_ITEM: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
    },
}

const IMAGE_MASK_CLASSES = {
    top: "inset-x-0 top-0 h-1/3 bg-linear-to-b from-primary to-transparent",
    right: "inset-y-0 right-0 w-1/3 bg-linear-to-l from-primary to-transparent",
    bottom: "inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-primary to-transparent",
    left: "inset-y-0 left-0 w-1/3 bg-linear-to-r from-primary to-transparent",
} as const

export function WideHeroSection({ content }: WideHeroSectionProps) {
    if (!content?.heading) return null

    const texts = content.texts?.flatMap((item) => (item.text ? [item.text] : [])) ?? []
    const buttons = content.buttons?.filter((button) => Boolean(button.label && button.url)) ?? []
    const image = content.image && typeof content.image === "object" ? (content.image as Media) : null
    const imageUrl = getMediaUrl(image?.url) || "/code0_software.png"
    const imageWidth = image?.width || 1200
    const imageHeight = image?.height || 675
    const configuredShineColors = [content.shineColors?.color1, content.shineColors?.color2, content.shineColors?.color3].flatMap((color) => {
        const value = color?.trim()
        return value ? [value] : []
    })
    const shineColors = configuredShineColors.length > 0 ? configuredShineColors : ["var(--bg-brand)", "var(--bg-pink)", "var(--bg-yellow)"]
    const shineBackground =
        shineColors.length === 1
            ? shineColors[0]
            : shineColors.length > 1
              ? `linear-gradient(90deg, ${shineColors.map((color, index) => `${color} ${(index / (shineColors.length - 1)) * 100}%`).join(", ")})`
              : undefined

    return (
        <Section showFunnel={false} animation={{ preset: "none" }} className="-mt-16 w-dvw max-w-none self-center lg:-mt-20 overflow-hidden border-b border-white/15">
            <div className="relative isolate min-h-[calc(100svh-3rem)] w-full bg-primary lg:h-[calc(100dvh-8rem)] lg:min-h-0">
                <div className="relative z-20 mx-auto grid min-h-[calc(100svh-3rem)] w-full max-w-348 grid-cols-1 grid-rows-[auto_auto] overflow-hidden lg:h-full lg:min-h-0 lg:grid-cols-[0.85fr_1.15fr] lg:grid-rows-1">
                    <motion.div
                        className="flex min-w-0 flex-col items-center justify-center px-6 pb-10 pt-28 text-center sm:px-8 sm:pb-12 sm:pt-32 md:px-12 lg:items-start lg:p-12 lg:text-left xl:p-16"
                        variants={STAGGER_CONTAINER}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.25 }}
                    >
                        {content.badge && (
                            <motion.div variants={STAGGER_ITEM}>
                                {content.badge_link ? (
                                    <Link href={content.badge_link}>
                                        <StableBadge className="group relative z-10 cursor-pointer px-3 text-xs" color="info">
                                            {content.badge}
                                            <IconArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                                        </StableBadge>
                                    </Link>
                                ) : (
                                    <StableBadge className="relative z-10 px-3 text-xs" color="info">
                                        {content.badge}
                                    </StableBadge>
                                )}
                            </motion.div>
                        )}

                        <motion.h1 variants={STAGGER_ITEM} className="mt-4 max-w-2xl text-balance text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                            {content.heading}
                        </motion.h1>

                        {texts.length > 0 && (
                            <motion.p variants={STAGGER_ITEM} className="mt-4 max-w-xl text-pretty text-base font-medium leading-7 text-white sm:text-lg lg:text-xl">
                                {texts.map((text, index) => (
                                    <Fragment key={`${text}-${index}`}>
                                        {text}
                                        {index < texts.length - 1 && <br />}
                                    </Fragment>
                                ))}
                            </motion.p>
                        )}

                        {buttons.length > 0 && (
                            <motion.div variants={STAGGER_ITEM} className="mt-8 flex w-full flex-col items-center justify-center gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-4 lg:justify-start">
                                {buttons.map((button, index) => (
                                    <HapticButtonLink
                                        href={button.url}
                                        key={`${button.label}-${button.id ?? index}`}
                                        variant={button.variant ?? "normal"}
                                        className={cn("w-full sm:w-auto", button.variant === "filled" && "bg-white/80! text-primary! hover:bg-white!")}
                                    >
                                        {button.label}
                                    </HapticButtonLink>
                                ))}
                            </motion.div>
                        )}
                    </motion.div>

                    <div className="relative flex min-h-0 items-center justify-center overflow-hidden p-6 sm:p-8 md:p-12 lg:p-12 xl:p-16">
                        <div className={cn("relative h-fit max-h-full w-fit max-w-full overflow-hidden rounded-3xl", (content.showImageBorder ?? true) && "border border-white/5")}>
                            <Image
                                src={imageUrl}
                                alt={image?.alt || content.heading}
                                width={imageWidth}
                                height={imageHeight}
                                priority
                                sizes="(min-width: 1024px) 58vw, 100vw"
                                className="block h-auto max-h-[50svh] w-auto max-w-full object-contain lg:max-h-[calc(100dvh-8rem)]"
                            />
                            {content.mask?.map((side) => (
                                <div key={side} aria-hidden="true" className={cn("pointer-events-none absolute z-10", IMAGE_MASK_CLASSES[side])} />
                            ))}
                        </div>
                    </div>
                </div>

                <div
                    aria-hidden="true"
                    className={cn("pointer-events-none absolute inset-x-0 bottom-0 z-30 h-16 translate-y-1/2 opacity-30 blur-2xl mix-blend-screen")}
                    style={shineBackground ? { background: shineBackground } : undefined}
                />
            </div>
        </Section>
    )
}
