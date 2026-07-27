"use client"

import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger"
import { Card } from "@/components/ui/Card"
import { HapticButtonLink } from "@/components/ui/HapticButtonLink"
import { Section } from "@/components/ui/Section"
import { StableBadge } from "@/components/ui/StableBadge"
import type { SmallPricingLayoutBlock, SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import NumberFlow from "@number-flow/react"
import { IconCheck, IconX } from "@tabler/icons-react"

type PackageContent = NonNullable<SmallPricingLayoutBlock["pro"]>

interface SmallPricingSectionProps {
    content?: SmallPricingLayoutBlock | null
    locale: AppLocale
    packages: SubscriptionConfigData["packages"]
}

export function SmallPricingSection({ content, locale, packages }: SmallPricingSectionProps) {
    if (!content) return null

    const selectedPeriod = content.pricingPeriod
    const periodMonths = selectedPeriod === "quarterly" ? 3 : selectedPeriod === "yearly" ? 12 : 1
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
        >
            <Card size="lg" variant="light" radialGradient={content.gradient} gradientDirection={content.gradientDirection} className="mx-auto w-full max-w-5xl p-2!">
                <StaggerContainer className="relative z-10 grid grid-cols-1 md:grid-cols-3" delayChildren={0.04} staggerChildren={0.08}>
                    {pricingPackages.map((pricingPackage) => {
                        const features = pricingPackage.content?.features?.filter((feature) => Boolean(feature.text)) ?? []
                        const missingFeatures = pricingPackage.content?.missingFeatures?.filter((feature) => Boolean(feature.text)) ?? []
                        const buttonLabel = pricingPackage.content?.button?.label?.trim()
                        const buttonUrl = pricingPackage.content?.button?.url?.trim()
                        const discount =
                            selectedPeriod !== "monthly" && pricingPackage.price !== null && pricingPackage.monthlyPrice !== null && pricingPackage.monthlyPrice > 0
                                ? Math.max(0, Math.round((1 - pricingPackage.price / (pricingPackage.monthlyPrice * periodMonths)) * 100))
                                : 0

                        return (
                            <StaggerItem key={pricingPackage.key} y={10} duration={0.36} className="flex min-w-0 flex-col p-5 sm:p-6">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="text-xl font-semibold text-white">{pricingPackage.title}</h3>
                                    {discount > 0 && (
                                        <StableBadge border className="shrink-0 border-brand/25! bg-brand/15! px-2 py-1 text-xs font-semibold tracking-wider text-brand!">
                                            -{discount}%
                                        </StableBadge>
                                    )}
                                </div>

                                {pricingPackage.price !== null && (
                                    <div className="mt-2 flex items-baseline gap-1">
                                        <NumberFlow
                                            value={pricingPackage.price}
                                            locales={locale === "de" ? "de-DE" : "en-US"}
                                            format={{ style: "currency", currency: "EUR", trailingZeroDisplay: "stripIfInteger" }}
                                            className="text-3xl font-semibold text-white"
                                        />
                                        <span className="text-lg font-semibold text-tertiary">{periodSuffix}</span>
                                    </div>
                                )}
                                {pricingPackage.description && <p className="text-sm leading-5 text-secondary">{pricingPackage.description}</p>}

                                {(features.length > 0 || missingFeatures.length > 0) && (
                                    <ul className="mt-6 flex flex-col gap-1.5">
                                        {features.map((feature, featureIndex) => (
                                            <li key={feature.id ?? `feature-${featureIndex}`} className="flex items-start gap-2 text-sm text-white">
                                                <IconCheck size={16} className="mt-0.5 shrink-0 text-brand" />
                                                <span>{feature.text}</span>
                                            </li>
                                        ))}
                                        {missingFeatures.map((feature, featureIndex) => (
                                            <li key={feature.id ?? `missing-feature-${featureIndex}`} className="flex items-start gap-2 text-sm text-tertiary">
                                                <IconX size={16} className="mt-0.5 shrink-0" />
                                                <span>{feature.text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {buttonLabel && buttonUrl && (
                                    <div className="mt-auto pt-6">
                                        <HapticButtonLink
                                            href={buttonUrl}
                                            variant={pricingPackage.content?.button?.variant ?? "normal"}
                                            className={cn("w-full text-sm!", pricingPackage.content?.button?.variant === "filled" && "bg-white/80! text-primary! hover:bg-white!")}
                                        >
                                            {buttonLabel}
                                        </HapticButtonLink>
                                    </div>
                                )}
                            </StaggerItem>
                        )
                    })}
                </StaggerContainer>
            </Card>
        </Section>
    )
}
