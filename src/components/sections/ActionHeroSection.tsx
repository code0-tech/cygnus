import { ActionIcon } from "@/components/ActionIcon"
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

type ActionHeroContent = {
    badge?: string | null
    badge_link?: string | null
    heading?: string | null
    texts?: { text?: string | null }[] | null
    buttons?: { label?: string | null; url?: string | null; variant?: "none" | "normal" | "outlined" | "filled" | null }[] | null
}

export function ActionHeroSection({ action, locale, content }: { action: ActionItem; locale: AppLocale; content?: ActionHeroContent | null }) {
    const buttons = content?.buttons?.filter((button) => Boolean(button.label && button.url)) ?? []
    const configuredHeading = content?.heading?.trim()
    const heading = configuredHeading ? configuredHeading.replaceAll("{}", action.title) : action.title
    const description = content?.texts?.flatMap((text) => (text.text?.trim() ? [text.text.trim()] : [])).join("\n") || action.description
    return (
        <Section showFunnel={false} className="w-full">
            <div className="relative overflow-hidden rounded-4xl border border-white/5 bg-light/35 h-[min(58svh,620px)] md:h-[min(62dvh,680px)]">
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
                        <div className="flex size-28 shrink-0 items-center justify-center rounded-3xl border border-white/10 bg-primary text-white sm:size-32">
                            <ActionIcon icon={action.icon} size={64} />
                        </div>
                        <div className="relative h-1 w-10 overflow-hidden bg-brand/20 sm:w-16">
                            <div
                                className="absolute inset-y-0 w-2/5 bg-brand shadow-[0_0_12px_var(--color-brand)]"
                                style={{ animation: "action-hero-pulse 1.8s ease-in-out infinite", willChange: "left, opacity" }}
                            />
                        </div>
                        <div className="flex size-28 shrink-0 items-center justify-center rounded-3xl border border-white/10 bg-white p-4 sm:size-32">
                            <Image src="/code0_logo_white.png" alt="Code0" width={80} height={80} className="size-full object-contain invert" />
                        </div>
                    </StaggerItem>
                </StaggerContainer>
            </div>
        </Section>
    )
}
