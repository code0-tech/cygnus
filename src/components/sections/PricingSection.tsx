"use client"

import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger"
import { HapticButtonLink } from "@/components/ui/HapticButtonLink"
import { Section } from "@/components/ui/Section"
import { StableBadge } from "@/components/ui/StableBadge"
import { Switch } from "@/components/ui/Switch"
import type { PricingLayoutBlock, SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import NumberFlow from "@number-flow/react"
import { IconCheck, IconX } from "@tabler/icons-react"
import { BorderBeam } from "border-beam"
import { useState } from "react"

type PricingPeriod = "monthly" | "quarterly" | "yearly"
type PackageContent = NonNullable<PricingLayoutBlock["pro"]>

interface PricingSectionProps {
    content?: PricingLayoutBlock | null
    locale: AppLocale
    packages: SubscriptionConfigData["packages"]
    paymentPeriod: SubscriptionConfigData["paymentPeriod"]
}

export function PricingSection({ content, locale, packages, paymentPeriod }: PricingSectionProps) {
    const [selectedPeriod, setSelectedPeriod] = useState<PricingPeriod>("monthly")
    if (!content) return null

    const periodOptions = [
        { value: "monthly", label: paymentPeriod.monthlyText },
        { value: "quarterly", label: paymentPeriod.quarterlyText },
        { value: "yearly", label: paymentPeriod.yearlyText },
    ] as const
    const periodSuffix = {
        monthly: "/mo",
        quarterly: "/qtr",
        yearly: "/yr",
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
                <Switch value={selectedPeriod} options={periodOptions} onChange={setSelectedPeriod} fitContent />
            </div>

            <StaggerContainer className="grid w-full grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3" delayChildren={0.04} staggerChildren={0.08}>
                {pricingPackages.map((pricingPackage) => {
                    const features = pricingPackage.content?.features?.filter((feature) => Boolean(feature.text)) ?? []
                    const missingFeatures = pricingPackage.content?.missingFeatures?.filter((feature) => Boolean(feature.text)) ?? []
                    const buttonLabel = pricingPackage.content?.button?.label?.trim()
                    const buttonUrl = pricingPackage.content?.button?.url?.trim()
                    const highlighted = pricingPackage.key === "max"
                    const periodMonths = selectedPeriod === "quarterly" ? 3 : selectedPeriod === "yearly" ? 12 : 1
                    const discount =
                        selectedPeriod !== "monthly" && pricingPackage.price !== null && pricingPackage.monthlyPrice !== null && pricingPackage.monthlyPrice > 0
                            ? Math.max(0, Math.round((1 - pricingPackage.price / (pricingPackage.monthlyPrice * periodMonths)) * 100))
                            : 0

                    const card = (
                        <StaggerItem
                            key={pricingPackage.key}
                            y={14}
                            duration={0.42}
                            className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-white/5 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_28%,rgba(8,10,20,0.6)_100%)] p-6 md:p-8"
                        >
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />
                            {discount > 0 && (
                                <StableBadge
                                    border
                                    className="absolute right-4 top-4 z-20 border-brand/25! bg-brand/15! px-3 py-1.5 text-sm font-semibold tracking-wider text-brand! md:right-6 md:top-6"
                                >
                                    -{discount}%
                                </StableBadge>
                            )}
                            <h3 className={cn("relative z-10 text-2xl font-semibold text-white", discount > 0 && "pr-20")}>{pricingPackage.title}</h3>

                            {pricingPackage.price !== null && (
                                <div className="relative z-10 mt-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <NumberFlow
                                            value={pricingPackage.price}
                                            locales={locale === "de" ? "de-DE" : "en-US"}
                                            format={{ style: "currency", currency: "EUR", trailingZeroDisplay: "stripIfInteger" }}
                                            className="text-4xl font-semibold text-white"
                                        />
                                        <span className="text-lg font-semibold text-tertiary">{periodSuffix}</span>
                                    </div>
                                </div>
                            )}
                            {pricingPackage.description && <p className="relative z-10 leading-6 text-secondary">{pricingPackage.description}</p>}

                            {(features.length > 0 || missingFeatures.length > 0) && (
                                <ul className="relative z-10 mt-8 flex flex-col gap-2">
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
                        <BorderBeam key={pricingPackage.key} size="pulse-inner" colorVariant="colorful" strength={0.7} className="h-full">
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
