"use client"

import { CheckoutDiscount, type CheckoutDiscountValue } from "@/components/checkout/CheckoutDiscount"
import { getIcon } from "@/components/ui/IconRenderer"
import type { CheckoutData, CheckoutSummaryIconColor, SubscriptionConfigData } from "@/lib/cms"
import { formatCompactNumber, formatEuroCurrency } from "@/lib/formatters"
import { calculateExclusiveTaxRate, calculatePromotionDiscountAmount, formatDiscountBadge, resolveCheckoutPricing } from "@/lib/subscriptionCalculator"
import type { CheckoutTaxQuote } from "@code0-tech/crater-graphql-types"
import { useParams, useSearchParams } from "next/navigation"
import { useState, type ReactNode } from "react"

type CheckoutTaxQuoteValue = {
    [Key in "amountTotal" | "currency" | "taxAmountExclusive"]-?: NonNullable<CheckoutTaxQuote[Key]>
}

interface CheckoutSummaryProps {
    content?: CheckoutData["summary"] | null
    sessionToken?: string | null
    subscriptionConfig?: SubscriptionConfigData | null
    taxQuote?: CheckoutTaxQuoteValue | null
}

interface SummaryBadgeProps {
    icon: ReactNode
    value: ReactNode
    tone?: CheckoutSummaryIconColor
}

function SummaryBadge({ icon, value, tone = "neutral" }: SummaryBadgeProps) {
    const iconToneClassName = {
        neutral: "text-white",
        brand: "text-brand",
        aqua: "text-aqua",
        blue: "text-blue",
        pink: "text-pink",
        yellow: "text-yellow",
        lime: "text-lime",
        magenta: "text-magenta",
    }[tone]
    const containerToneClassName = {
        neutral: "border-white/10 bg-white/5",
        brand: "border-brand/10 bg-brand/5",
        aqua: "border-aqua/10 bg-aqua/5",
        blue: "border-blue/10 bg-blue/5",
        pink: "border-pink/10 bg-pink/5",
        yellow: "border-yellow/10 bg-yellow/5",
        lime: "border-lime/10 bg-lime/5",
        magenta: "border-magenta/10 bg-magenta/5",
    }[tone]

    return (
        <span className={`inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-xl border pl-2 pr-3 py-1 text-sm ${containerToneClassName}`}>
            <span className={`inline-flex shrink-0 ${iconToneClassName}`}>{icon}</span>
            <span className="min-w-0 truncate font-medium text-white">{value}</span>
        </span>
    )
}

export function CheckoutSummary({ content, sessionToken, subscriptionConfig, taxQuote }: CheckoutSummaryProps) {
    const searchParams = useSearchParams()
    const params = useParams<{ locale?: string }>()
    const [promotionDiscount, setPromotionDiscount] = useState<CheckoutDiscountValue | null>(null)
    if (!content) return null

    const deployment = searchParams.get("deploymentType") ?? searchParams.get("deployment")
    const customerType = searchParams.get("customerType")
    const planParam = searchParams.get("plan")
    const paymentPeriodParam = searchParams.get("paymentPeriod")
    const workflowExecutionsParam = searchParams.get("workflowExecutions")
    const aiTokensParam = searchParams.get("aiTokens")
    const additionalFeaturesParam = searchParams.get("additionalFeatures")
    const selectedAdditionalFeatureIds =
        additionalFeaturesParam
            ?.split(",")
            .map((feature) => feature.trim())
            .filter((feature) => feature.length > 0) ?? []
    const { additionalFeaturesPrice, aiTokens, isCustomPlan, paymentPeriod, periodSuffix, planTitle, pricing, selectedAdditionalFeatures, workflowExecutions } = resolveCheckoutPricing({
        additionalFeatureIds: selectedAdditionalFeatureIds,
        aiTokensParam,
        customerTypeParam: customerType,
        fallbackPeriodSuffix: content.pricing.perMonthSuffix,
        paymentPeriodParam,
        planParam,
        subscriptionConfig,
        workflowExecutionsParam,
    })
    const locale = params?.locale === "de" ? "de" : "en"
    const monthlyPeriodSuffix = subscriptionConfig?.paymentPeriod.monthlyPeriodSuffix ?? content.pricing.perMonthSuffix
    const paymentPeriodDiscountAmount = Math.max(0, pricing.totalBeforeDiscount - pricing.totalPrice)
    const paymentPeriodDiscountPercentage = pricing.totalBeforeDiscount > 0 ? paymentPeriodDiscountAmount / pricing.totalBeforeDiscount : 0
    const paymentPeriodDiscountLabel = paymentPeriod === "quarterly" ? content.pricing.quarterlyDiscountLabel : paymentPeriod === "yearly" ? content.pricing.yearlyDiscountLabel : null
    const promotionDiscountAmount = calculatePromotionDiscountAmount(pricing.totalPrice, promotionDiscount)
    const discountedPrice = Math.max(0, pricing.totalPrice - promotionDiscountAmount)
    const taxAmount = taxQuote ? taxQuote.taxAmountExclusive / 100 : 0
    const taxPercentage = taxQuote ? calculateExclusiveTaxRate(taxQuote.amountTotal, taxQuote.taxAmountExclusive) : 0
    const totalPrice = taxQuote ? Math.max(0, taxQuote.amountTotal / 100 - promotionDiscountAmount) : discountedPrice
    const formattedTotalPrice = formatEuroCurrency(totalPrice, locale)
    const formattedBasePrice = formatEuroCurrency(pricing.aiTokenPrice, locale)
    const formattedWorkflowExecutionsPrice = formatEuroCurrency(pricing.workflowExecutionPrice, locale)
    const formattedAdditionalFeaturesPrice = formatEuroCurrency(additionalFeaturesPrice, locale)
    const formattedPaymentPeriodDiscountAmount = formatEuroCurrency(paymentPeriodDiscountAmount, locale)
    const formattedDiscountAmount = formatEuroCurrency(promotionDiscountAmount, locale)
    const formattedTaxAmount = formatEuroCurrency(taxAmount, locale)

    return (
        <div className="flex-1 h-max pl-3">
            <div className="mb-6">
                <p className="tracking-wide text-brand">{content.eyebrow}</p>
                <h2 className="mt-4 text-2xl text-white">{content.heading}</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-secondary">{content.description}</p>
            </div>

            {isCustomPlan && (deployment || customerType || aiTokensParam || workflowExecutionsParam) && (
                <div className="flex flex-col gap-2">
                    <span className="text-sm text-secondary">{content.configurationLabel}</span>
                    <div className="flex flex-wrap items-center gap-1.5 mb-4">
                        {deployment && (
                            <SummaryBadge
                                icon={getIcon(deployment === "cloud" ? content.deploymentIcons.cloud : content.deploymentIcons.selfHosted, 16)}
                                tone={content.deploymentIconColor}
                                value={<span className="capitalize">{deployment.replaceAll("_", " ").replaceAll("-", " ")}</span>}
                            />
                        )}
                        {customerType && (
                            <SummaryBadge
                                icon={getIcon(customerType === "b2c" ? content.customerTypeIcons.b2c : content.customerTypeIcons.b2b, 16)}
                                tone={content.customerTypeIconColor}
                                value={<span className="uppercase">{customerType}</span>}
                            />
                        )}
                        {aiTokensParam && (
                            <SummaryBadge
                                icon={getIcon(content.aiTokensIcon, 16)}
                                tone={content.aiTokensIconColor}
                                value={
                                    <span>
                                        {formatCompactNumber(aiTokens)} {monthlyPeriodSuffix}
                                    </span>
                                }
                            />
                        )}
                        {workflowExecutionsParam && (
                            <SummaryBadge
                                icon={getIcon(content.workflowExecutionsIcon, 16)}
                                tone={content.workflowExecutionsIconColor}
                                value={
                                    <span>
                                        {formatCompactNumber(workflowExecutions)} {monthlyPeriodSuffix}
                                    </span>
                                }
                            />
                        )}
                    </div>
                </div>
            )}

            <div className="mt-4 mb-2 rounded-2xl border border-white/10 bg-white/2 p-4">
                <div className="-mx-4 flex items-center justify-between gap-3 border-b border-white/10 px-4 pb-3">
                    <div>
                        <p className="text-sm text-white">{content.pricing.label}</p>
                        <p className="mt-1 text-sm text-tertiary">{content.pricing.description}</p>
                    </div>
                </div>

                <div className="space-y-2 pt-4">
                    <div className="flex items-start justify-between gap-4 text-sm">
                        <span className="text-secondary">{content.pricing.planLabel}</span>
                        <span className="shrink-0 text-white">{planTitle}</span>
                    </div>

                    {isCustomPlan && (
                        <>
                            <div className="flex items-start justify-between gap-4 text-sm">
                                <span className="text-secondary">{content.pricing.baseLabel}</span>
                                <span className="shrink-0 tabular-nums text-white">{formattedBasePrice}</span>
                            </div>

                            <div className="flex items-start justify-between gap-4 text-sm">
                                <span className="text-secondary">{content.pricing.workflowExecutionsLabel}</span>
                                <span className="shrink-0 tabular-nums text-white">{formattedWorkflowExecutionsPrice}</span>
                            </div>
                        </>
                    )}

                    {selectedAdditionalFeatures.length > 0 && (
                        <div className="flex items-start justify-between gap-4 text-sm">
                            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                                <span className="text-secondary">{content.pricing.additionalFeaturesLabel}</span>
                                <SummaryBadge
                                    icon={getIcon(content.additionalFeaturesIcon, 16)}
                                    tone={content.additionalFeaturesIconColor}
                                    value={selectedAdditionalFeatures.map((feature) => feature.title).join(", ")}
                                />
                            </div>
                            <span className="shrink-0 tabular-nums text-white">{formattedAdditionalFeaturesPrice}</span>
                        </div>
                    )}

                    {paymentPeriodDiscountLabel && paymentPeriodDiscountAmount > 0 && (
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-secondary">
                                {paymentPeriodDiscountLabel} (-{formatDiscountBadge(paymentPeriodDiscountPercentage, locale)})
                            </span>
                            <span className="tabular-nums text-white">-{formattedPaymentPeriodDiscountAmount}</span>
                        </div>
                    )}

                    {taxQuote && (
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-secondary">
                                {content.pricing.taxLabel} ({formatDiscountBadge(taxPercentage, locale)})
                            </span>
                            <span className="tabular-nums text-white">{formattedTaxAmount}</span>
                        </div>
                    )}
                </div>

                <div className="-mx-4 mt-4 flex items-center justify-between gap-4 border-t border-white/10 px-4 pt-4 text-sm">
                    <span className="text-secondary">{content.pricing.totalLabel}</span>
                    <span className="tabular-nums text-brand text-lg">
                        {formattedTotalPrice} <span className="text-tertiary text-sm">{periodSuffix}</span>
                    </span>
                </div>
            </div>

            <CheckoutDiscount
                appliedAmount={promotionDiscountAmount > 0 ? formattedDiscountAmount : null}
                buttonLabel={content.pricing.discountButtonLabel}
                inputPlaceholder={content.pricing.discountInputPlaceholder}
                onApplied={setPromotionDiscount}
                promptLabel={content.pricing.discountPromptLabel}
                removeLabel={content.pricing.discountRemoveLabel}
                sessionToken={sessionToken}
            />
        </div>
    )
}
