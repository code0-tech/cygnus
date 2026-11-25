"use client"

import type { PaymentPeriod } from "@/lib/subscription/types"
import { HapticButtonLink } from "@/components/ui/HapticButtonLink"
import { Section } from "@/components/ui/Section"
import { FormattedText } from "@/components/ui/FormattedText"
import { StableBadge } from "@/components/ui/StableBadge"
import { SegmentedControl, SegmentedControlItem } from "@code0-tech/pictor"
import type { PricingLayoutBlock, SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { formatDiscountBadge, resolveCheckoutPricing } from "@/lib/subscription/calculator"
import type { SubscriptionPriceCatalog } from "@/lib/subscription/prices"
import { cn } from "@/lib/utils"
import NumberFlow from "@number-flow/react"
import { IconCheck } from "@tabler/icons-react"
import { Fragment, useState } from "react"

const defaultComparisonCategories: NonNullable<PricingLayoutBlock["comparisonCategories"]> = [
    { title: "Usage", rows: [
        { label: "Workflow executions per month", pro: "2,000", max: "25,000", custom: "Configurable" },
        { label: "AI tokens per month", pro: "500k", max: "4M", custom: "Configurable" },
    ] },
    { title: "Build", rows: [
        { label: "Visual flow builder", pro: "\u2713", max: "\u2713", custom: "\u2713" },
        { label: "AI agents with MCP & multi-agent", pro: "\u2713", max: "\u2713", custom: "\u2713" },
        { label: "Files in flows", pro: "\u2713", max: "\u2713", custom: "\u2713" },
    ] },
    { title: "Run & debug", rows: [
        { label: "Deterministic replay", pro: "\u2713", max: "\u2713", custom: "\u2713" },
        { label: "Eject as binary / WASM", pro: "\u2713", max: "\u2713", custom: "\u2713" },
    ] },
    { title: "Support", rows: [{ label: "[SUPPORT LEVEL]", pro: "\u2014", max: "\u2014", custom: "\u2014" }] },
]

interface PricingSectionProps {
    content?: PricingLayoutBlock | null
    locale: AppLocale
    subscriptionConfig: SubscriptionConfigData
    subscriptionPrices: SubscriptionPriceCatalog
}

export function PricingSection({ content, locale, subscriptionConfig, subscriptionPrices }: PricingSectionProps) {
    const [selectedPeriod, setSelectedPeriod] = useState<PaymentPeriod>("monthly")
    if (!content || !subscriptionConfig || !subscriptionPrices) return null
    const paymentPeriod = subscriptionConfig.paymentPeriod

    const getPricingForPeriod = (plan: "pro" | "max", period: PaymentPeriod) =>
        resolveCheckoutPricing({
            aiTokensParam: null,
            customerTypeParam: content.pricingCustomerType ?? "b2c",
            fallbackPeriodSuffix: subscriptionConfig.paymentPeriod.monthlyPeriodSuffix,
            paymentPeriodParam: period,
            planParam: plan,
            subscriptionConfig,
            subscriptionPrices,
            workflowExecutionsParam: null,
        })

    const getPeriodDiscount = (period: PaymentPeriod) => {
        const { pricing } = getPricingForPeriod("pro", period)

        if (pricing.totalBeforeDiscount <= 0) return 0

        return Math.max(0, (pricing.totalBeforeDiscount - pricing.totalPrice) / pricing.totalBeforeDiscount)
    }

    const periodOptions = [
        {
            value: "monthly",
            label: subscriptionConfig.paymentPeriod.monthlyText,
            badge: getPeriodDiscount("monthly") > 0 ? `-${formatDiscountBadge(getPeriodDiscount("monthly"), locale)}` : null,
        },
        {
            value: "quarterly",
            label: subscriptionConfig.paymentPeriod.quarterlyText,
            badge: getPeriodDiscount("quarterly") > 0 ? `-${formatDiscountBadge(getPeriodDiscount("quarterly"), locale)}` : null,
        },
        {
            value: "yearly",
            label: subscriptionConfig.paymentPeriod.yearlyText,
            badge: getPeriodDiscount("yearly") > 0 ? `-${formatDiscountBadge(getPeriodDiscount("yearly"), locale)}` : null,
        },
    ] as const

    const periodSuffix = {
        monthly: paymentPeriod.monthlyPeriodSuffix,
        quarterly: paymentPeriod.quarterlyPeriodSuffix,
        yearly: paymentPeriod.yearlyPeriodSuffix,
    }[selectedPeriod]

    const proPricing = getPricingForPeriod("pro", selectedPeriod)
    const maxPricing = getPricingForPeriod("max", selectedPeriod)

    const pricingPackages = [
        {
            key: "pro",
            title: subscriptionConfig.plan.pro.title || "Pro",
            description: subscriptionConfig.plan.pro.description,
            price: proPricing.pricing.totalPrice,
            pricing: proPricing.pricing,
            content: content.pro,
        },
        {
            key: "max",
            title: subscriptionConfig.plan.max.title || "Max",
            description: subscriptionConfig.plan.max.description,
            price: maxPricing.pricing.totalPrice,
            pricing: maxPricing.pricing,
            content: content.max,
        },
        {
            key: "custom",
            title: subscriptionConfig.plan.custom.title || "Custom",
            description: subscriptionConfig.plan.custom.description,
            price: null,
            pricing: null,
            content: content.custom,
        },
    ]

    const comparisonCategories = content.comparisonCategories?.length ? content.comparisonCategories : defaultComparisonCategories

    return (
        <Section
            showFunnel={false}
            animation={{ preset: "none" }}
            className="overflow-visible!"
        >
            <div className="flex w-full flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-2xl text-left">
                    <h2 className="text-3xl font-semibold leading-tight text-white md:text-4xl">
                        {content.sectionHeading ? <FormattedText text={content.sectionHeading} /> : (
                            <>
                                Your pricing for Enterprise,<br />
                                <span className="text-secondary">licensed per workspace.</span>
                            </>
                        )}
                    </h2>
                </div>
                <SegmentedControl
                    type="single"
                    color="secondary"
                    aria-label={paymentPeriod.label}
                    value={selectedPeriod}
                    onValueChange={(value) => {
                        const option = periodOptions.find((option) => option.value === value)
                        if (option) setSelectedPeriod(option.value)
                    }}
                    className="grid! w-full max-w-full shrink-0 grid-cols-3! sm:w-auto [&>span]:min-w-0"
                >
                    {periodOptions.map((option) => (
                        <SegmentedControlItem key={option.value} value={option.value} className="w-full! min-w-0! px-3! py-2! text-xs! sm:min-w-40! sm:text-sm!">
                            <span className="flex min-w-0 items-center justify-center gap-2">
                                <span className="truncate">{option.label}</span>
                                {option.badge && (
                                    <StableBadge color="info" border className="shrink-0">
                                        {option.badge}
                                    </StableBadge>
                                )}
                            </span>
                        </SegmentedControlItem>
                    ))}
                </SegmentedControl>
            </div>

            <div className="w-full overflow-x-auto rounded-3xl bg-light shadow-[inset_0_1px_1px_#bfbfbf1a]">
                <table className="w-full min-w-[850px] border-collapse text-left">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th scope="col" className="w-[32%] px-6 py-6 align-bottom text-lg font-semibold text-white">{locale === "de" ? "Tarife vergleichen" : "Compare plans"}{content.comparisonIntro && <p className="mt-1 text-sm font-normal text-secondary">{content.comparisonIntro}</p>}</th>
                            {pricingPackages.map((pricingPackage) => {
                                const highlighted = pricingPackage.key === "max"
                                const regularPrice = pricingPackage.pricing?.totalBeforeDiscount ?? null
                                const discount = regularPrice && pricingPackage.price !== null && pricingPackage.price < regularPrice ? (regularPrice - pricingPackage.price) / regularPrice : 0
                                return (
                                    <th key={pricingPackage.key} scope="col" className={cn("w-[22.6%] px-5 py-6 align-top", highlighted && "bg-white/[0.06]")}>
                                        <div className="flex min-h-7 items-center justify-between gap-2">
                                            <span className="text-lg font-semibold text-white">{pricingPackage.title}</span>
                                            {highlighted && <StableBadge border className="border! border-brand/20! bg-brand/5! px-2 py-0.5 text-xs text-brand!">Popular</StableBadge>}
                                        </div>
                                        {pricingPackage.price !== null ? <>
                                            <div className="mt-3 flex items-baseline gap-2 whitespace-nowrap">
                                                <NumberFlow value={pricingPackage.price} locales={locale === "de" ? "de-DE" : "en-US"} format={{ style: "currency", currency: "EUR", trailingZeroDisplay: "stripIfInteger" }} className="text-3xl font-semibold text-white" />
                                                <span className="text-xs font-normal text-tertiary">{periodSuffix}</span>
                                            </div>
                                            {discount > 0 && <p className="mt-1 text-xs text-brand">-{formatDiscountBadge(discount, locale)}</p>}
                                        </> : <p className="mt-3 flex items-baseline gap-2 text-3xl font-semibold text-white"><span className="text-sm font-normal">{locale === "de" ? "ab" : "from"}</span><NumberFlow value={49.9} locales={locale === "de" ? "de-DE" : "en-US"} format={{ style: "currency", currency: "EUR", minimumFractionDigits: 2 }} /></p>}
                                        {pricingPackage.description && <p className="mt-1 text-sm font-normal text-secondary">{pricingPackage.description}</p>}
                                        {pricingPackage.content?.button?.label?.trim() && pricingPackage.content.button.url?.trim() && <HapticButtonLink href={pricingPackage.content.button.url.trim()} variant={pricingPackage.content.button.variant ?? "normal"} className={cn("mt-4 w-full whitespace-nowrap", highlighted && "bg-white! text-primary! hover:bg-white/90!")}>{pricingPackage.content.button.label.trim()}</HapticButtonLink>}
                                    </th>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {comparisonCategories.map((category, categoryIndex) => <Fragment key={category.id ?? category.title}>
                            <tr>
                                <th scope="rowgroup" className="px-6 pt-5 pb-2 text-sm font-semibold text-white">{category.title}</th>
                                {pricingPackages.map((pricingPackage) => <td key={pricingPackage.key} className={cn("pt-5 pb-2", pricingPackage.key === "max" && "bg-white/[0.06]")} />)}
                            </tr>
                            {category.rows?.map((row, rowIndex) => <tr key={row.id ?? row.label} className={cn(rowIndex === (category.rows?.length ?? 0) - 1 && categoryIndex < comparisonCategories.length - 1 && "border-b border-white/[0.07]")}>
                                <th scope="row" className="px-6 py-3.5 text-sm font-normal text-secondary">{row.label}</th>
                                {pricingPackages.map((pricingPackage) => {
                                    const value = row[pricingPackage.key as "pro" | "max" | "custom"]
                                    return <td key={pricingPackage.key} className={cn("px-5 py-3.5 text-sm", pricingPackage.key === "max" && "bg-white/[0.06]")}>{value === "\u2713" ? <IconCheck aria-label={locale === "de" ? "Enthalten" : "Included"} size={17} className="text-brand" /> : <span className="text-white">{value || "\u2014"}</span>}</td>
                                })}
                            </tr>)}
                        </Fragment>)}
                    </tbody>
                </table>
            </div>
        </Section>
    )
}
