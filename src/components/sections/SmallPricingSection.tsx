"use client"

import type { PaymentPeriod } from "@/lib/subscription/types"
import { Card } from "@/components/ui/Card"
import { HapticButtonLink } from "@/components/ui/HapticButtonLink"
import { Section } from "@/components/ui/Section"
import { StableBadge } from "@/components/ui/StableBadge"
import type { SmallPricingLayoutBlock, SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { formatDiscountBadge, resolveCheckoutPricing } from "@/lib/subscription/calculator"
import type { SubscriptionPriceCatalog } from "@/lib/subscription/prices"
import type { CheckoutPackages } from "@/lib/subscription/usagePackages"
import NumberFlow from "@number-flow/react"

interface SmallPricingSectionProps {
    content?: SmallPricingLayoutBlock | null
    locale: AppLocale
    subscriptionConfig: SubscriptionConfigData
    subscriptionPrices: SubscriptionPriceCatalog
    checkoutPackages?: CheckoutPackages | null
}

export function SmallPricingSection({ content, locale, subscriptionConfig, subscriptionPrices, checkoutPackages }: SmallPricingSectionProps) {
    if (!content || !subscriptionConfig || !subscriptionPrices) return null
    const paymentPeriod = subscriptionConfig.paymentPeriod
    const selectedPeriod = content.pricingPeriod
    const customerType = content.pricingCustomerType ?? "b2c"

    const getPricingForPeriod = (plan: "pro" | "max", period: PaymentPeriod) =>
        resolveCheckoutPricing({
            aiTokensParam: null,
            customerTypeParam: customerType,
            fallbackPeriodSuffix: subscriptionConfig.paymentPeriod.monthlyPeriodSuffix,
            paymentPeriodParam: period,
            planParam: plan,
            subscriptionConfig,
            subscriptionPrices,
            workflowExecutionsParam: null,
        })

    const periodSuffix = {
        monthly: paymentPeriod.monthlyPeriodSuffix,
        quarterly: paymentPeriod.quarterlyPeriodSuffix,
        yearly: paymentPeriod.yearlyPeriodSuffix,
    }[selectedPeriod]
    const proPricing = getPricingForPeriod("pro", selectedPeriod)
    const maxPricing = getPricingForPeriod("max", selectedPeriod)
    const getDiscount = (period: PaymentPeriod) => {
        const { pricing } = getPricingForPeriod("pro", period)
        return pricing.totalBeforeDiscount > 0 ? Math.max(0, (pricing.totalBeforeDiscount - pricing.totalPrice) / pricing.totalBeforeDiscount) : 0
    }
    const pricingPackages = [
        { key: "pro", title: subscriptionConfig.plan.pro.title || "Pro", description: subscriptionConfig.plan.pro.description, price: proPricing.pricing.totalPrice },
        { key: "max", title: subscriptionConfig.plan.max.title || "Max", description: subscriptionConfig.plan.max.description, price: maxPricing.pricing.totalPrice },
        { key: "custom", title: subscriptionConfig.plan.custom.title || "Custom", description: subscriptionConfig.plan.custom.description, price: null },
    ] as const
    const formatQuantity = (value: number) => new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value)
    const detailsUrl = content.sectionLinkButton?.url?.trim() || "/pricing"
    const detailsLabel = locale === "de" ? "Alle Tarifdetails ansehen" : "See all plan details"
    const periodSavings = locale === "de"
        ? `Spare ${formatDiscountBadge(getDiscount("quarterly"), locale)} quartalsweise oder ${formatDiscountBadge(getDiscount("yearly"), locale)} j\u00e4hrlich.`
        : `Save ${formatDiscountBadge(getDiscount("quarterly"), locale)} quarterly or ${formatDiscountBadge(getDiscount("yearly"), locale)} yearly.`

    return (
        <Section
            heading={content.sectionHeading || "**Simple pricing**\\nfor every stage of your business."}
            funnelType={content.sectionLayout ?? "center"}
            animation={{ preset: "none" }}
        >
            <Card size="lg" variant="default" topline={false} className="mx-auto w-full max-w-6xl rounded-3xl border-0! bg-light! p-2! shadow-[inset_0_1px_1px_#bfbfbf1a]">
                <div className="grid grid-cols-1 gap-0 md:grid-cols-2 xl:grid-cols-4">
                    {pricingPackages.map((pricingPackage) => {
                        const highlighted = pricingPackage.key === "max"
                        const discount = pricingPackage.key === "pro" ? getDiscount(selectedPeriod) : pricingPackage.key === "max" && maxPricing.pricing.totalBeforeDiscount > 0
                            ? Math.max(0, (maxPricing.pricing.totalBeforeDiscount - maxPricing.pricing.totalPrice) / maxPricing.pricing.totalBeforeDiscount)
                            : 0
                        const quantities = pricingPackage.key !== "custom" ? checkoutPackages?.planQuantities[pricingPackage.key] : null
                        return (
                            <div key={pricingPackage.key} className={`relative flex min-h-[220px] min-w-0 flex-col rounded-2xl p-5 sm:p-6 ${highlighted ? "bg-white/[0.06]" : ""}`}>
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="text-xl font-semibold text-white">{pricingPackage.title}</h3>
                                    {highlighted && <StableBadge border className="border! border-brand/20! bg-brand/5! px-2 py-0.5 text-xs text-brand!">Popular</StableBadge>}
                                </div>
                                {pricingPackage.description && <p className="mt-1 text-sm leading-5 text-secondary">{pricingPackage.description}</p>}
                                <div className="mt-auto pt-6">
                                    <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                                        {pricingPackage.price !== null ? (
                                            <NumberFlow value={pricingPackage.price} locales={locale === "de" ? "de-DE" : "en-US"} format={{ style: "currency", currency: "EUR", trailingZeroDisplay: "stripIfInteger" }} className="text-3xl font-semibold text-white" />
                                        ) : <><span className="text-sm text-secondary">{locale === "de" ? "ab" : "from"}</span><NumberFlow value={49.9} locales={locale === "de" ? "de-DE" : "en-US"} format={{ style: "currency", currency: "EUR", minimumFractionDigits: 2 }} className="text-3xl font-semibold text-white" /></>}
                                        <span className="text-sm text-tertiary">{periodSuffix}</span>
                                        {discount > 0 && <span className="text-xs font-medium text-brand">-{formatDiscountBadge(discount, locale)}</span>}
                                    </div>
                                    {quantities && <p className="mt-4 text-sm text-secondary">{formatQuantity(quantities.workflowExecutions)} {locale === "de" ? "Ausf\u00fchrungen" : "executions"} {"\u2022"} {formatQuantity(quantities.aiTokens)} AI tokens</p>}
                                    {pricingPackage.key === "custom" && <p className="mt-4 text-sm text-secondary">{locale === "de" ? "Nutzung individuell konfigurierbar" : "Usage you configure yourself"}</p>}
                                </div>
                            </div>
                        )
                    })}
                    <div className="flex min-h-[220px] min-w-0 flex-col p-5 sm:p-6">
                        <h3 className="text-xl font-semibold text-white">{locale === "de" ? "Noch unsicher?" : "Not sure yet?"}</h3>
                        <p className="mt-1 text-sm leading-5 text-secondary">{locale === "de" ? "Vergleiche alle Tarife und Funktionen im Detail." : "Compare all plans and features side by side."}</p>
                        <div className="mt-auto pt-6">
                            <HapticButtonLink href={detailsUrl} variant="filled" className="w-full bg-white! text-primary! hover:bg-white/90!">{detailsLabel}</HapticButtonLink>
                            <p className="mt-3 text-center text-xs text-tertiary">{periodSavings}</p>
                        </div>
                    </div>
                </div>
            </Card>
        </Section>
    )
}
