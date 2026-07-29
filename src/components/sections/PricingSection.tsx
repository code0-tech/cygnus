"use client"

import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger"
import { HapticButtonLink } from "@/components/ui/HapticButtonLink"
import { getIcon } from "@/components/ui/IconRenderer"
import { Section } from "@/components/ui/Section"
import { StableBadge } from "@/components/ui/StableBadge"
import { Switch } from "@/components/ui/Switch"
import type { PricingLayoutBlock, SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import NumberFlow from "@number-flow/react"
import { IconCheck, IconX } from "@tabler/icons-react"
import { BorderBeam } from "border-beam"
import { AnimatePresence, m as motion } from "motion/react"
import { useState } from "react"

type PricingPeriod = "monthly" | "quarterly" | "yearly"
type PackageContent = NonNullable<PricingLayoutBlock["pro"]>

const popularPillColorClasses = {
    brand: "border-brand/10! bg-brand/10! text-brand!",
    pink: "border-pink/10! bg-pink/10! text-pink!",
    yellow: "border-yellow/10! bg-yellow/10! text-yellow!",
    aqua: "border-aqua/10! bg-aqua/10! text-aqua!",
    blue: "border-blue/10! bg-blue/10! text-blue!",
    lime: "border-lime/10! bg-lime/10! text-lime!",
    magenta: "border-magenta/10! bg-magenta/10! text-magenta!",
} as const

const highlightedCardColors = {
    brand: "var(--bg-brand)",
    pink: "var(--bg-pink)",
    yellow: "var(--bg-yellow)",
    aqua: "var(--bg-aqua)",
    blue: "var(--bg-blue)",
    lime: "var(--bg-lime)",
    magenta: "var(--bg-magenta)",
} as const

interface PricingSectionProps {
    content?: PricingLayoutBlock | null
    locale: AppLocale
    packages: SubscriptionConfigData["packages"]
    paymentPeriod: SubscriptionConfigData["paymentPeriod"]
}

export function PricingSection({ content, locale, packages, paymentPeriod }: PricingSectionProps) {
    const [selectedPeriod, setSelectedPeriod] = useState<PricingPeriod>("monthly")
    if (!content) return null

    const quarterlyDiscount = Math.round((paymentPeriod.quarterlyDiscount ?? 0) * 100)
    const yearlyDiscount = Math.round((paymentPeriod.yearlyDiscount ?? 0) * 100)
    const periodOptions = [
        { value: "monthly", label: paymentPeriod.monthlyText },
        { value: "quarterly", label: paymentPeriod.quarterlyText, badge: quarterlyDiscount > 0 ? `-${quarterlyDiscount}%` : null },
        { value: "yearly", label: paymentPeriod.yearlyText, badge: yearlyDiscount > 0 ? `-${yearlyDiscount}%` : null },
    ] as const
    const periodSuffix = {
        monthly: paymentPeriod.monthlyPeriodSuffix,
        quarterly: paymentPeriod.quarterlyPeriodSuffix,
        yearly: paymentPeriod.yearlyPeriodSuffix,
    }[selectedPeriod]
    const pricingPackages = [
        {
            key: "pro",
            title: packages.pro.title || "Pro",
            description: packages.pro.description,
            price: packages.pro.prices[selectedPeriod],
            monthlyPrice: packages.pro.prices.monthly,
            content: content.pro,
        },
        {
            key: "max",
            title: packages.max.title || "Max",
            description: packages.max.description,
            price: packages.max.prices[selectedPeriod],
            monthlyPrice: packages.max.prices.monthly,
            content: content.max,
        },
        {
            key: "custom",
            title: packages.custom.title || "Custom",
            description: packages.custom.description,
            price: null,
            monthlyPrice: null,
            content: content.custom,
        },
    ] satisfies {
        key: "pro" | "max" | "custom"
        title: string
        description: string
        price: number | null
        monthlyPrice: number | null
        content?: PackageContent
    }[]

    return (
        <Section
            heading={content.sectionHeading}
            description={content.sectionDescription}
            linkButton={content.sectionLinkButton}
            funnelType={content.sectionLayout ?? "center"}
            animation={{ preset: "none" }}
            className="overflow-visible!"
        >
            <div className="flex w-full justify-center">
                <Switch value={selectedPeriod} options={periodOptions} onChange={setSelectedPeriod} className="[&>div>button]:min-w-34 sm:[&>div>button]:min-w-40" fitContent />
            </div>

            <StaggerContainer className="grid w-full grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3" delayChildren={0.04} staggerChildren={0.08}>
                {pricingPackages.map((pricingPackage) => {
                    const features = pricingPackage.content?.features?.filter((feature) => Boolean(feature.text)) ?? []
                    const missingFeatures = pricingPackage.content?.missingFeatures?.filter((feature) => Boolean(feature.text)) ?? []
                    const buttonLabel = pricingPackage.content?.button?.label?.trim()
                    const buttonUrl = pricingPackage.content?.button?.url?.trim()
                    const highlighted = pricingPackage.key === "max"
                    const popularPillColor = content.popularPill?.color ?? "brand"
                    const highlightedCardColor = content.highlightedCardColor ? highlightedCardColors[content.highlightedCardColor] : null
                    const periodMonths = selectedPeriod === "quarterly" ? 3 : selectedPeriod === "yearly" ? 12 : 1
                    const configuredDiscount = selectedPeriod === "quarterly" ? paymentPeriod.quarterlyDiscount : selectedPeriod === "yearly" ? paymentPeriod.yearlyDiscount : 0
                    const priceWithoutPeriodDiscount = pricingPackage.price !== null && configuredDiscount > 0 && configuredDiscount < 1 ? pricingPackage.price / (1 - configuredDiscount) : null
                    const priceBasedOnMonthlyRate =
                        selectedPeriod !== "monthly" && pricingPackage.monthlyPrice !== null && pricingPackage.monthlyPrice > 0 ? pricingPackage.monthlyPrice * periodMonths : null
                    const regularPrice =
                        priceBasedOnMonthlyRate !== null && pricingPackage.price !== null && priceBasedOnMonthlyRate > pricingPackage.price ? priceBasedOnMonthlyRate : priceWithoutPeriodDiscount
                    const hasDiscount = regularPrice !== null && pricingPackage.price !== null && pricingPackage.price < regularPrice

                    const card = (
                        <StaggerItem
                            key={pricingPackage.key}
                            y={14}
                            duration={0.42}
                            className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-white/5 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_28%,rgba(8,10,20,0.6)_100%)] p-6 md:p-8"
                            style={
                                highlighted && highlightedCardColor
                                    ? {
                                          background: `linear-gradient(160deg, color-mix(in oklch, ${highlightedCardColor} 8%, transparent), color-mix(in oklch, ${highlightedCardColor} 2%, transparent) 28%, rgba(8, 10, 20, 0.6) 100%)`,
                                      }
                                    : undefined
                            }
                        >
                            {highlighted && <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(1_0_0/0.1),transparent_36%)]" />}
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />
                            {highlighted && content.popularPill?.text && (
                                <div className="absolute right-4 top-4 z-20 md:right-6 md:top-6">
                                    <StableBadge border className={cn("border! py-0.5 pr-3 pl-2 text-sm font-medium", popularPillColorClasses[popularPillColor])}>
                                        <span className="inline-flex items-center gap-1.5">
                                            {getIcon(content.popularPill.icon, 14)}
                                            {content.popularPill.text}
                                        </span>
                                    </StableBadge>
                                </div>
                            )}
                            <h3
                                className={cn("relative z-10 text-2xl font-semibold text-white", pricingPackage.price !== null && "pr-20")}
                                style={highlighted && content.titleColor ? { color: content.titleColor } : undefined}
                            >
                                {pricingPackage.title}
                            </h3>
                            {pricingPackage.description && <p className="relative z-10 mt-1 leading-6 text-secondary">{pricingPackage.description}</p>}

                            {pricingPackage.price !== null && (
                                <div className="relative z-10 mt-6 flex flex-col items-start gap-0">
                                    <AnimatePresence initial={false}>
                                        {hasDiscount && (
                                            <motion.span
                                                key={selectedPeriod}
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 4 }}
                                                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                                className="relative -mb-1 inline-flex text-sm leading-none font-medium text-tertiary after:absolute after:top-1/2 after:right-0 after:left-0 after:z-10 after:h-px after:bg-current after:content-['']"
                                            >
                                                {regularPrice.toLocaleString(locale === "de" ? "de-DE" : "en-US", {
                                                    style: "currency",
                                                    currency: "EUR",
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <NumberFlow
                                            value={pricingPackage.price}
                                            locales={locale === "de" ? "de-DE" : "en-US"}
                                            format={{ style: "currency", currency: "EUR", trailingZeroDisplay: "stripIfInteger" }}
                                            className="text-4xl font-semibold text-white"
                                        />
                                        <span className="mt-2 text-base text-tertiary">{periodSuffix}</span>
                                    </div>
                                </div>
                            )}

                            {(features.length > 0 || missingFeatures.length > 0) && (
                                <div className="relative z-10 mt-8">
                                    {content.whatsIncludedText && <p className="text-sm text-secondary">{content.whatsIncludedText}</p>}
                                    <ul className={cn("flex flex-col gap-2", content.whatsIncludedText && "mt-3")}>
                                        {features.map((feature, featureIndex) => (
                                            <li key={feature.id ?? `feature-${featureIndex}`} className="flex items-start gap-3 text-sm text-white">
                                                <IconCheck size={18} className="mt-0.5 shrink-0 text-brand" />
                                                <span>{feature.text}</span>
                                            </li>
                                        ))}
                                        {missingFeatures.map((feature, featureIndex) => (
                                            <li key={feature.id ?? `missing-feature-${featureIndex}`} className="flex items-start gap-3 text-sm text-tertiary">
                                                <IconX size={18} className="mt-0.5 shrink-0" />
                                                <span>{feature.text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {buttonLabel && buttonUrl && (
                                <div className="relative z-10 mt-auto pt-8">
                                    <HapticButtonLink
                                        href={buttonUrl}
                                        variant={pricingPackage.content?.button?.variant ?? "normal"}
                                        className={cn("w-full", pricingPackage.content?.button?.variant === "filled" && "bg-white/80! text-primary! hover:bg-white!")}
                                    >
                                        {buttonLabel}
                                    </HapticButtonLink>
                                </div>
                            )}
                        </StaggerItem>
                    )

                    return highlighted ? (
                        <BorderBeam key={pricingPackage.key} size="md" colorVariant="colorful" strength={0.7} duration={3.5} className="h-full">
                            {card}
                        </BorderBeam>
                    ) : (
                        card
                    )
                })}
            </StaggerContainer>
        </Section>
    )
}
