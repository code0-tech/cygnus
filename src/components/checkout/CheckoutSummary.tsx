"use client"

import { CheckoutDiscount } from "@/components/checkout/CheckoutDiscount"
import { getIcon } from "@/components/ui/IconRenderer"
import type { CheckoutData, CheckoutSummaryIconColor, SubscriptionConfigData } from "@/lib/cms"
import { formatCompactNumber, formatEuroCurrency } from "@/lib/formatters"
import { calculateExclusiveTaxRate, formatDiscountBadge, resolveCheckoutPricing } from "@/lib/subscriptionCalculator"
import { useParams, useSearchParams } from "next/navigation"
import type { ReactNode } from "react"

type CheckoutSummaryContent = CheckoutData["summary"]

interface CheckoutSummaryProps {
    content?: CheckoutSummaryContent | null
    sessionToken?: string | null
    subscriptionConfig?: SubscriptionConfigData | null
    taxQuote?: {
        amountTotal: number
        currency: string
        taxAmountExclusive: number
    } | null
}

interface SummaryRowProps {
    icon: ReactNode
    label: string
    value: ReactNode
    tone?: CheckoutSummaryIconColor
}

function SummaryRow({ icon, label, value, tone = "neutral" }: SummaryRowProps) {
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

    return (
        <div className="flex items-center gap-3 py-1">
            <div className="flex min-w-0 items-center gap-3">
                <div className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/2 ${iconToneClassName}`}>{icon}</div>
                <div className="min-w-0">
                    <p className="text-xs tracking-wide text-tertiary">{label}</p>
                    <div className="mt-0.5 text-sm font-semibold tracking-wide text-white">{value}</div>
                </div>
            </div>
        </div>
    )
}

export function CheckoutSummary({ content, sessionToken, subscriptionConfig, taxQuote }: CheckoutSummaryProps) {
    const searchParams = useSearchParams()
    const params = useParams<{ locale?: string }>()
    if (!content) return null

    const deployment = searchParams.get("deployment")
    const customerType = searchParams.get("customerType")
    const planParam = searchParams.get("plan")
    const paymentPeriod = searchParams.get("paymentPeriod")
    const workflowExecutionsParam = searchParams.get("workflowExecutions")
    const aiTokensParam = searchParams.get("aiTokens")
    const additionalFeaturesParam = searchParams.get("additionalFeatures")
    const selectedAdditionalFeatureIds =
        additionalFeaturesParam
            ?.split(",")
            .map((feature) => feature.trim())
            .filter((feature) => feature.length > 0) ?? []
    const { additionalFeaturesPrice, aiTokens, isCustomPlan, periodSuffix, planTitle, pricing, selectedAdditionalFeatures, workflowExecutions } = resolveCheckoutPricing({
        additionalFeatureIds: selectedAdditionalFeatureIds,
        aiTokensParam,
        customerTypeParam: customerType,
        fallbackPeriodSuffix: content.pricing.perMonthSuffix,
        paymentPeriodParam: paymentPeriod,
        planParam,
        subscriptionConfig,
        workflowExecutionsParam,
    })
    const locale = params?.locale === "de" ? "de" : "en"
    const discountAmount = Math.max(0, pricing.totalBeforeDiscount - pricing.totalPrice)
    const discountPercentage = pricing.totalBeforeDiscount > 0 ? discountAmount / pricing.totalBeforeDiscount : 0
    const taxAmount = taxQuote ? taxQuote.taxAmountExclusive / 100 : 0
    const taxPercentage = taxQuote ? calculateExclusiveTaxRate(taxQuote.amountTotal, taxQuote.taxAmountExclusive) : 0
    const totalPrice = taxQuote ? taxQuote.amountTotal / 100 : pricing.totalPrice
    const formattedTotalPrice = formatEuroCurrency(totalPrice, locale)
    const formattedBasePrice = formatEuroCurrency(pricing.aiTokenPrice, locale)
    const formattedWorkflowExecutionsPrice = formatEuroCurrency(pricing.workflowExecutionPrice, locale)
    const formattedAdditionalFeaturesPrice = formatEuroCurrency(additionalFeaturesPrice, locale)
    const formattedDiscountAmount = formatEuroCurrency(discountAmount, locale)
    const formattedTaxAmount = formatEuroCurrency(taxAmount, locale)

    return (
        <div className="flex-1 h-max pl-3">
            <div className="mb-5">
                <p className="tracking-wide text-brand">{content.eyebrow}</p>
                <h2 className="mt-4 text-2xl text-white">{content.heading}</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-secondary">{content.description}</p>
            </div>

            <div className="space-y-2">
                {isCustomPlan && deployment && (
                    <SummaryRow
                        icon={getIcon(deployment === "cloud" ? content.deploymentIcons.cloud : content.deploymentIcons.selfHosted, 16)}
                        label={content.deploymentLabel}
                        tone={content.deploymentIconColor}
                        value={<span className="capitalize">{deployment.replace("-", " ")}</span>}
                    />
                )}

                {isCustomPlan && customerType && (
                    <SummaryRow
                        icon={getIcon(customerType === "b2c" ? content.customerTypeIcons.b2c : content.customerTypeIcons.b2b, 16)}
                        label={content.customerTypeLabel}
                        tone={content.customerTypeIconColor}
                        value={<span className="uppercase">{customerType}</span>}
                    />
                )}

                {isCustomPlan && aiTokensParam && (
                    <SummaryRow icon={getIcon(content.aiTokensIcon, 16)} label={content.aiTokensLabel} tone={content.aiTokensIconColor} value={<span>{formatCompactNumber(aiTokens)}</span>} />
                )}

                {isCustomPlan && workflowExecutionsParam && (
                    <SummaryRow
                        icon={getIcon(content.workflowExecutionsIcon, 16)}
                        label={content.workflowExecutionsLabel}
                        tone={content.workflowExecutionsIconColor}
                        value={<span>{formatCompactNumber(workflowExecutions)}</span>}
                    />
                )}

                {selectedAdditionalFeatures.length > 0 && (
                    <SummaryRow
                        icon={getIcon(content.additionalFeaturesIcon, 16)}
                        label={content.additionalFeaturesLabel}
                        tone={content.additionalFeaturesIconColor}
                        value={<span>{selectedAdditionalFeatures.map((feature) => feature.title).join(", ")}</span>}
                    />
                )}

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/2 p-4">
                    <div className="-mx-4 flex items-center justify-between gap-3 border-b border-white/10 px-4 pb-3">
                        <div>
                            <p className="text-xs tracking-wide text-tertiary">{content.pricing.label}</p>
                            <p className="mt-1 text-sm text-white">{content.pricing.description}</p>
                        </div>
                    </div>

                    <CheckoutDiscount
                        buttonLabel={content.pricing.discountButtonLabel}
                        inputPlaceholder={content.pricing.discountInputPlaceholder}
                        sessionToken={sessionToken}
                    />

                    <div className="space-y-2 pt-4">
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-secondary">{content.pricing.planLabel}</span>
                            <span className="text-white">{planTitle}</span>
                        </div>

                        {isCustomPlan && (
                            <>
                                <div className="flex items-center justify-between gap-4 text-sm">
                                    <span className="text-secondary">{content.pricing.baseLabel}</span>
                                    <span className="tabular-nums text-white">{formattedBasePrice}</span>
                                </div>

                                <div className="flex items-center justify-between gap-4 text-sm">
                                    <span className="text-secondary">{content.pricing.workflowExecutionsLabel}</span>
                                    <span className="tabular-nums text-white">{formattedWorkflowExecutionsPrice}</span>
                                </div>
                            </>
                        )}

                        {selectedAdditionalFeatures.length > 0 && (
                            <div className="flex items-center justify-between gap-4 text-sm">
                                <span className="text-secondary">{content.pricing.additionalFeaturesLabel}</span>
                                <span className="tabular-nums text-white">{formattedAdditionalFeaturesPrice}</span>
                            </div>
                        )}

                        {discountAmount > 0 && (
                            <div className="flex items-center justify-between gap-4 text-sm">
                                <span className="text-secondary">
                                    {content.pricing.discountLabel} (-{formatDiscountBadge(discountPercentage, locale)})
                                </span>
                                <span className="tabular-nums text-white">-{formattedDiscountAmount}</span>
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
            </div>
        </div>
    )
}
