"use client"

import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger"
import { Card } from "@/components/ui/Card"
import { HapticButtonLink } from "@/components/ui/HapticButtonLink"
import { Section } from "@/components/ui/Section"
import { StableBadge } from "@/components/ui/StableBadge"
import type { SmallPricingLayoutBlock, SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { formatDiscountBadge, resolveCheckoutPricing } from "@/lib/subscriptionCalculator"
import { PricingPeriod, SubscriptionPriceCatalog } from "@/lib/subscriptionPrices"
import { cn } from "@/lib/utils"
import NumberFlow from "@number-flow/react"
import { IconCheck, IconX } from "@tabler/icons-react"

interface SmallPricingSectionProps {
    content?: SmallPricingLayoutBlock | null
    locale: AppLocale
    subscriptionConfig: SubscriptionConfigData
    subscriptionPrices: SubscriptionPriceCatalog
}

export function SmallPricingSection({ content, locale, subscriptionConfig, subscriptionPrices }: SmallPricingSectionProps) {
    if (!content || !subscriptionConfig || !subscriptionPrices) return null
    const selectedPeriod = content.pricingPeriod

    const getPricingForPeriod = (plan: "pro" | "max", period: PricingPeriod) =>
        resolveCheckoutPricing({
            aiTokensParam: null,
            customerTypeParam: "b2c",
            fallbackPeriodSuffix: subscriptionConfig.paymentPeriod.monthlyPeriodSuffix,
            paymentPeriodParam: period,
            planParam: plan,
            subscriptionConfig,
            subscriptionPrices,
            workflowExecutionsParam: null,
        })

    const periodSuffix = {
        monthly: "/mo",
        quarterly: "/qtr",
        yearly: "/yr",
    }[selectedPeriod]

    const proPricing = getPricingForPeriod("pro", selectedPeriod)
    const maxPricing = getPricingForPeriod("max", selectedPeriod)
    const pricingPackages = [
        {
            key: "pro",
            title: subscriptionConfig.packages.pro.title || "Pro",
            description: subscriptionConfig.packages.pro.description,
            price: proPricing.pricing.totalPrice,
            pricing: proPricing.pricing,
            content: content.pro,
        },
        {
            key: "max",
            title: subscriptionConfig.packages.max.title || "Max",
            description: subscriptionConfig.packages.max.description,
            price: maxPricing.pricing.totalPrice,
            pricing: maxPricing.pricing,
            content: content.max,
        },
        {
            key: "custom",
            title: subscriptionConfig.packages.custom.title || "Custom",
            description: subscriptionConfig.packages.custom.description,
            price: null,
            pricing: null,
            content: content.custom,
        },
    ]

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
                            pricingPackage.pricing && pricingPackage.pricing.totalBeforeDiscount > 0
                                ? Math.max(0, (pricingPackage.pricing.totalBeforeDiscount - pricingPackage.pricing.totalPrice) / pricingPackage.pricing.totalBeforeDiscount)
                                : 0

                        return (
                            <StaggerItem key={pricingPackage.key} y={10} duration={0.36} className="relative flex min-w-0 flex-col overflow-hidden p-5 sm:p-6">
                                {highlighted && (
                                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(1_0_0/0.1),transparent_68%)] md:hidden" />
                                )}
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="text-xl font-semibold text-white">{pricingPackage.title}</h3>
                                    {discount > 0 && (
                                        <StableBadge border className="border! border-brand/10! bg-brand/10! px-3 py-1 text-sm font-medium text-brand!">
                                            <span className="inline-flex items-baseline gap-0">-{formatDiscountBadge(discount, locale)}</span>
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
