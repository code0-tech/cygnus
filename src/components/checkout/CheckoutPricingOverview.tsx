"use client"

import { SummaryBadge } from "@/components/checkout/CheckoutSummaryBadge"
import { getIcon } from "@/components/ui/IconRenderer"
import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"
import { formatCompactNumber, formatCurrency } from "@/lib/formatters"
import type { AppLocale } from "@/lib/i18n"
import { formatDiscountBadge } from "@/lib/subscriptionCalculator"
import { Card } from "@code0-tech/pictor"
import NumberFlow from "@number-flow/react"

export interface CheckoutPricingOverviewData {
    aiTokenPrice: number
    aiTokens: number
    currency?: string
    customerType: string | null
    deployment: string | null
    isCustomPlan: boolean
    monthlyPeriodSuffix: string
    paymentPeriodDiscountAmount: number
    paymentPeriodDiscountLabel: string | null
    paymentPeriodDiscountPercentage: number
    periodSuffix: string
    planPrice: number | null
    planTitle: string
    taxAmount: number
    taxPercentage: number | null
    totalPrice: number
    workflowExecutionPrice: number
    workflowExecutions: number
}

interface CheckoutPricingOverviewProps extends CheckoutPricingOverviewData {
    content: CheckoutData["summary"]
    locale: AppLocale
    subscriptionConfig: SubscriptionConfigData
}

export function CheckoutPricingOverview({
    aiTokenPrice,
    aiTokens,
    content,
    currency = "EUR",
    customerType,
    deployment,
    isCustomPlan,
    locale,
    monthlyPeriodSuffix,
    paymentPeriodDiscountAmount,
    paymentPeriodDiscountLabel,
    paymentPeriodDiscountPercentage,
    periodSuffix,
    planPrice,
    planTitle,
    subscriptionConfig,
    taxAmount,
    taxPercentage,
    totalPrice,
    workflowExecutionPrice,
    workflowExecutions,
}: CheckoutPricingOverviewProps) {
    const plan = planTitle === "Pro" ? subscriptionConfig.plan.pro : planTitle === "Max" ? subscriptionConfig.plan.max : subscriptionConfig.plan.custom

    return (
        <Card className="bg-light! p-4!">
            <span className="flex items-center gap-2 text-sm text-secondary pb-1">
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
            </span>

            <div className="space-y-2 pt-4">
                {planPrice !== null && (
                    <div className="flex items-start justify-between gap-4 text-sm text-secondary">
                        {content.pricing.planLabel}
                        <span className="shrink-0 tabular-nums text-white">{formatCurrency(planPrice, currency, locale)}</span>
                    </div>
                )}

                {isCustomPlan && (
                    <>
                        <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="flex items-center gap-1 text-secondary">
                                {content.pricing.baseLabel}
                                <span className="text-tertiary">
                                    {formatCompactNumber(aiTokens)} {monthlyPeriodSuffix}
                                </span>
                            </span>
                            <span className="shrink-0 tabular-nums text-white">{formatCurrency(aiTokenPrice, currency, locale)}</span>
                        </div>

                        <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="flex items-center gap-1 text-secondary">
                                {content.pricing.workflowExecutionsLabel}
                                <span className="text-tertiary">
                                    {formatCompactNumber(workflowExecutions)} {monthlyPeriodSuffix}
                                </span>
                            </span>
                            <span className="shrink-0 tabular-nums text-white">{formatCurrency(workflowExecutionPrice, currency, locale)}</span>
                        </div>
                    </>
                )}

                {paymentPeriodDiscountLabel && paymentPeriodDiscountAmount > 0 && (
                    <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-secondary">
                            {paymentPeriodDiscountLabel} <span className="text-tertiary">(-{formatDiscountBadge(paymentPeriodDiscountPercentage, locale)})</span>
                        </span>
                        <span className="tabular-nums text-white">-{formatCurrency(paymentPeriodDiscountAmount, currency, locale)}</span>
                    </div>
                )}

                <div id="checkout-applied-discount" className="empty:hidden" aria-live="polite" />

                {taxPercentage !== null && (
                    <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="flex items-center gap-1 text-secondary">
                            {content.pricing.taxLabel} <span className="text-tertiary">({formatDiscountBadge(taxPercentage, locale)})</span>
                        </span>
                        <span className="tabular-nums text-white">{formatCurrency(taxAmount, currency, locale)}</span>
                    </div>
                )}
            </div>

            <div className="-mx-4 mt-2 -mb-2 flex items-center justify-between gap-4 border-t border-white/5 px-4 pt-2 text-sm">
                <span className="text-secondary">{content.pricing.totalLabel}</span>

                <div className="flex items-center gap-2">
                    <NumberFlow
                        value={totalPrice}
                        className="text-lg text-brand"
                        locales={locale === "de" ? "de-DE" : "en-US"}
                        format={{ style: "currency", currency: currency.toUpperCase(), trailingZeroDisplay: "stripIfInteger" }}
                    />
                    <span className="text-sm text-tertiary">{periodSuffix}</span>
                </div>
            </div>
        </Card>
    )
}
