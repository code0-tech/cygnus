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
    paymentPeriod: SubscriptionConfigData["paymentPeriod"]
}

export function SmallPricingSection({ content, locale, packages, paymentPeriod }: SmallPricingSectionProps) {
    if (!content) return null

    const selectedPeriod = content.pricingPeriod
    const periodMonths = selectedPeriod === "quarterly" ? 3 : selectedPeriod === "yearly" ? 12 : 1
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
        >
            <Card size="lg" variant="light" radialGradient={content.gradient} gradientDirection={content.gradientDirection} className="mx-auto w-full max-w-5xl p-2!">
                <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/3 hidden w-1/3 bg-[radial-gradient(ellipse_at_top,oklch(1_0_0/0.1),transparent_68%)] md:block" />
                <StaggerContainer className="relative z-10 grid grid-cols-1 md:grid-cols-3" delayChildren={0.04} staggerChildren={0.08}>
                    {pricingPackages.map((pricingPackage) => {
                        const features = pricingPackage.content?.features?.filter((feature) => Boolean(feature.text)) ?? []
                        const missingFeatures = pricingPackage.content?.missingFeatures?.filter((feature) => Boolean(feature.text)) ?? []
                        const buttonLabel = pricingPackage.content?.button?.label?.trim()
                        const buttonUrl = pricingPackage.content?.button?.url?.trim()
                        const highlighted = pricingPackage.key === "max"
                        const discount =
                            selectedPeriod !== "monthly" && pricingPackage.price !== null && pricingPackage.monthlyPrice !== null && pricingPackage.monthlyPrice > 0
                                ? Math.max(0, Math.round((1 - pricingPackage.price / (pricingPackage.monthlyPrice * periodMonths)) * 100))
                                : 0

                        return (
                            <StaggerItem key={pricingPackage.key} y={10} duration={0.36} className="relative flex min-w-0 flex-col overflow-hidden p-5 sm:p-6">
                                {highlighted && (
                                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(1_0_0/0.1),transparent_68%)] md:hidden" />
                                )}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <h3 className="text-xl font-semibold text-white">{pricingPackage.title}</h3>
                                        {pricingPackage.description && <p className="text-sm leading-5 text-secondary">{pricingPackage.description}</p>}
                                    </div>
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
                                        <span className="text-base text-tertiary">{periodSuffix}</span>
                                    </div>
                                )}

                                {(features.length > 0 || missingFeatures.length > 0) && (
                                    <ul className="mt-4 flex flex-col gap-1.5">
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
