import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger"
import { Section } from "@/components/ui/Section"
import type { HeroLayoutBlock } from "@/lib/cms"
import { getMediaUrl } from "@/lib/media"
import { cn } from "@/lib/utils"
import type { Media } from "@/payload-types"
import { IconArrowRight } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"
import React from "react"
import Grainient from "../ui/Granient"
import { HapticButtonLink } from "../ui/HapticButtonLink"
import { StableBadge } from "../ui/StableBadge"
import { ProductHuntBadge } from "./client/ProductHuntBadge"

interface HeroSectionProps {
    content?: HeroLayoutBlock | null
}

export function HeroSection({ content }: HeroSectionProps) {
    if (!content?.heading) return

    const texts = content.texts?.flatMap((item) => (item.text ? [item.text] : [])) ?? []
    const buttons = content.buttons?.filter((button) => Boolean(button.label && button.url)) ?? []
    const centered = Boolean(content.centered)
    const heroImage = content.image && typeof content.image !== "number" ? (content.image as Media) : null
    const resolvedImageSrc = getMediaUrl(heroImage?.url)
    const hasHeroImage = Boolean(resolvedImageSrc)
    const resolvedImageAlt = heroImage?.alt || content.heading
    const grainientColors = {
        color1: content.grainientColors?.color1 ?? undefined,
        color2: content.grainientColors?.color2 ?? undefined,
        color3: content.grainientColors?.color3 ?? undefined,
        backgroundColor: content.grainientColors?.backgroundColor ?? undefined,
    }

    if (centered) {
        return (
            <Section showFunnel={false}>
                <div
                    className={cn(
                        "relative isolate overflow-hidden rounded-4xl border border-white/5 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_28%,rgba(8,10,20,0.92)_100%)]",
                        hasHeroImage ? "h-[min(85svh,918px)] md:h-[min(85dvh,918px)]" : "h-fit"
                    )}
                >
                    <Grainient {...grainientColors} />
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(5,8,18,0.68)_0%,rgba(5,8,18,0.4)_34%,transparent_68%)]" />
                    <StaggerContainer className="relative z-20 flex flex-col items-center justify-center gap-10 p-8 lg:p-16">
                        <div className="flex w-full max-w-6xl flex-col items-center gap-4">
                            <StaggerItem as="h1" className="relative z-10 text-balance text-3xl font-bold text-white lg:text-5xl text-center">
                                {content.heading}
                            </StaggerItem>

                            <StaggerItem as="p" className="relative z-10 max-w-2xl text-base font-medium text-pretty text-white lg:text-xl text-center">
                                {texts.map((text, index) => (
                                    <React.Fragment key={`${text}-${index}`}>
                                        {text}
                                        {index < texts.length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                            </StaggerItem>

                            <StaggerItem className="mt-4 flex w-full flex-col items-center gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-4">
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
                            </StaggerItem>
                        </div>

                        {hasHeroImage && (
                            <div className="w-full max-w-6xl">
                                <div
                                    className="rounded-[1.3rem] border border-white/20 bg-light p-1"
                                    style={content.imageBackground?.trim() ? { backgroundColor: content.imageBackground.trim() } : undefined}
                                >
                                    <div className="relative overflow-hidden rounded-2xl">
                                        <Image
                                            src={resolvedImageSrc}
                                            alt={resolvedImageAlt}
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
                        )}
                    </StaggerContainer>
                </div>
            </Section>
        )
    }

    return (
        <Section showFunnel={false}>
            <div
                className={cn(
                    "relative isolate overflow-hidden rounded-4xl border border-white/5 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_28%,rgba(8,10,20,0.92)_100%)]",
                    hasHeroImage ? "h-[min(85svh,918px)] md:h-[min(85dvh,918px)]" : "h-fit"
                )}
            >
                <ProductHuntBadge />

                <Grainient />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-0 z-10 w-full bg-[radial-gradient(circle_at_18%_24%,rgba(5,8,18,0.68),transparent_40%),linear-gradient(90deg,rgba(5,8,18,0.56)_0%,rgba(5,8,18,0.28)_34%,transparent_62%)] lg:w-[56%]"
                />

                <StaggerContainer className={"relative z-20 flex h-full flex-col items-center justify-between gap-8 rounded-3xl p-8 lg:flex-row lg:p-16"}>
                    <div className={cn("flex w-full flex-col gap-4 text-start", hasHeroImage ? "lg:w-2/5" : "lg:max-w-3xl")}>
                        <StaggerItem>
                            <Link href={content.badge_link ?? ""}>
                                <StableBadge className="group relative z-10 text-xs px-3 cursor-pointer" color="info">
                                    {content.badge}
                                    <IconArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </StableBadge>
                            </Link>
                        </StaggerItem>

                        <StaggerItem as="h1" className="relative z-10 font-bold text-3xl lg:text-4xl text-white text-balance">
                            {content.heading}
                        </StaggerItem>

                        <StaggerItem as="p" className="relative z-10 font-medium text-white text-base lg:text-xl text-pretty">
                            {texts.length > 0 &&
                                texts.map((text, index) => (
                                    <React.Fragment key={`${text}-${index}`}>
                                        {text}
                                        {index < texts.length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                        </StaggerItem>

                        <StaggerItem className={"flex flex-col gap-2 sm:gap-4 mt-4"}>
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
                        </StaggerItem>
                    </div>
                    {hasHeroImage && (
                        <div className="h-auto w-full lg:w-4/5 lg:-mr-56">
                            <div
                                className="rounded-[1.3rem] border border-white/20 bg-light p-1 lg:rounded-l-[1.3rem] lg:rounded-r-none"
                                style={content.imageBackground?.trim() ? { backgroundColor: content.imageBackground.trim() } : undefined}
                            >
                                <div className="relative overflow-hidden rounded-2xl lg:rounded-l-2xl lg:rounded-r-none">
                                    <Image
                                        src={resolvedImageSrc}
                                        alt={resolvedImageAlt}
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
                    )}
                </StaggerContainer>
            </div>
        </Section>
    )
}
