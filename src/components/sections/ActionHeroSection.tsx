import { ActionIcon } from "@/components/actions/ActionIcon"
import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger"
import { Section } from "@/components/ui/Section"
import { HapticButtonLink } from "@/components/ui/HapticButtonLink"
import { cn } from "@/lib/utils"
import type { ActionItem } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { IconArrowRight } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"
import { StableBadge } from "@/components/ui/StableBadge"
import Grainient from "@/components/ui/Granient"

type ActionHeroContent = {
    badge?: string | null
    badge_link?: string | null
    heading?: string | null
    texts?: { text?: string | null }[] | null
    buttons?: { label?: string | null; url?: string | null; variant?: "none" | "normal" | "outlined" | "filled" | null }[] | null
    grainientColors?: {
        color1?: string | null
        color2?: string | null
        color3?: string | null
        backgroundColor?: string | null
    } | null
}

const ACTION_GRAINIENT_DEFAULTS = {
    color1: "#72f896",
    color2: "#7472f8",
    color3: "#13102d",
    backgroundColor: "#13102d",
} as const

export function ActionHeroSection({ action, locale, content }: { action: ActionItem; locale: AppLocale; content?: ActionHeroContent | null }) {
    const buttons = content?.buttons?.filter((button) => Boolean(button.label && button.url)) ?? []
    const configuredHeading = content?.heading?.trim()
    const heading = configuredHeading ? configuredHeading.replaceAll("{}", action.title) : action.title
    const description = content?.texts?.flatMap((text) => (text.text?.trim() ? [text.text.trim()] : [])).join("\n") || action.description
    const grainientColors = {
        color1: action.brandColor1?.trim() || content?.grainientColors?.color1?.trim() || ACTION_GRAINIENT_DEFAULTS.color1,
        color2: action.brandColor2?.trim() || content?.grainientColors?.color2?.trim() || ACTION_GRAINIENT_DEFAULTS.color2,
        color3: content?.grainientColors?.color3?.trim() || ACTION_GRAINIENT_DEFAULTS.color3,
        backgroundColor: content?.grainientColors?.backgroundColor?.trim() || ACTION_GRAINIENT_DEFAULTS.backgroundColor,
    }
    return (
        <Section showFunnel={false} className="w-full">
            <div className="relative overflow-hidden rounded-4xl border border-white/5 bg-light/35 h-[min(58svh,620px)] md:h-[min(62dvh,680px)]">
                <Grainient {...grainientColors} />
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-1 bg-[linear-gradient(90deg,rgba(5,8,18,0.64)_0%,rgba(5,8,18,0.4)_42%,rgba(5,8,18,0.16)_100%)]" />
                <StaggerContainer className="relative z-10 flex h-full flex-col items-center justify-between gap-8 p-8 lg:flex-row lg:p-16">
                    <div className="flex w-full flex-col gap-4 text-left lg:w-1/2">
                        {content?.badge && (
                            <StaggerItem>
                                {content.badge_link ? (
                                    <Link href={content.badge_link}>
                                        <StableBadge color="info" className="group text-xs">
                                            {content.badge}
                                            <IconArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                                        </StableBadge>
                                    </Link>
                                ) : (
                                    <StableBadge color="info" className="text-xs">
                                        {content.badge}
                                    </StableBadge>
                                )}
                            </StaggerItem>
                        )}
                        <StaggerItem as="h1" className="text-balance text-3xl font-bold text-white lg:text-4xl">
                            {heading}
                        </StaggerItem>
                        {description && (
                            <StaggerItem as="p" className="max-w-2xl whitespace-pre-line text-base font-medium text-secondary lg:text-xl">
                                {description}
                            </StaggerItem>
                        )}
                        {buttons.length > 0 && (
                            <StaggerItem className="mt-4 flex flex-col gap-2 sm:gap-4">
                                {buttons.map((button, index) => (
                                    <HapticButtonLink
                                        key={`${button.label}-${index}`}
                                        href={button.url!}
                                        variant={button.variant ?? "normal"}
                                        className={cn(button.variant === "filled" && "bg-white/80! text-primary! hover:bg-white!")}
                                    >
                                        {button.label}
                                    </HapticButtonLink>
                                ))}
                            </StaggerItem>
                        )}
                    </div>
                    <StaggerItem className="flex w-full items-center justify-center gap-0 lg:w-1/2">
                        <div className="flex size-28 shrink-0 items-center justify-center rounded-3xl border border-white/25 bg-white p-4 shadow-[0_0_0_4px_rgba(255,255,255,0.045),0_12px_32px_rgba(0,0,0,0.18)] sm:size-32">
                            <Image src="/code0_logo_white.png" alt="Code0" width={80} height={80} className="size-full object-contain invert" />
                        </div>
                        <div className="flex w-10 flex-col gap-3 sm:w-16">
                            {[0, 0.22, 0.44].map((delay) => (
                                <div key={delay} className="relative h-0.5 overflow-hidden bg-white/25">
                                    <div
                                        className="absolute inset-y-0 w-2/5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                                        style={{ animation: "action-hero-pulse 1.8s linear infinite", animationDelay: `${delay}s`, willChange: "left, opacity" }}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex size-28 shrink-0 items-center justify-center rounded-3xl border border-white/20 bg-primary text-white shadow-[0_0_0_4px_rgba(255,255,255,0.035),0_12px_32px_rgba(0,0,0,0.22)] sm:size-32">
                            <ActionIcon icon={action.icon} size={64} />
                        </div>
                    </StaggerItem>
                </StaggerContainer>
            </div>
        </Section>
    )
}
