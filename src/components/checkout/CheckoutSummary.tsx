"use client"

import { CheckoutDiscount, type CheckoutDiscountValue } from "@/components/checkout/CheckoutDiscount"
import { SummaryBadge } from "@/components/checkout/CheckoutSummaryBadge"
import { CheckoutUpgradePlan } from "@/components/checkout/CheckoutUpgradePlan"
import { getIcon } from "@/components/ui/IconRenderer"
import { Switch } from "@/components/ui/Switch"
import type { CheckoutTaxQuoteData } from "@/lib/checkout/checkoutSubmission"
import type { CheckoutData, ErrorsContent, SubscriptionConfigData } from "@/lib/cms"
import { formatCompactNumber, formatEuroCurrency } from "@/lib/formatters"
import { calculateExclusiveTaxRate, calculatePromotionDiscountAmount, formatDiscountBadge, resolveCheckoutPricing, type PaymentPeriod } from "@/lib/subscriptionCalculator"
import { getPaymentPeriodOptions, type SubscriptionCustomerType } from "@/lib/subscriptionConfigurator"
import type { SubscriptionPriceCatalog } from "@/lib/subscriptionPrices"
import NumberFlow from "@number-flow/react"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Card } from "../ui/Card"

interface CheckoutSummaryProps {
    content?: CheckoutData["summary"] | null
    errors?: ErrorsContent | null
    subscriptionConfig?: SubscriptionConfigData | null
    subscriptionPrices: SubscriptionPriceCatalog
    taxQuote?: CheckoutTaxQuoteData | null
    upgradeBanner?: CheckoutData["upgradeBanner"] | null
}

export function CheckoutSummary({ content, errors, subscriptionConfig, subscriptionPrices, taxQuote, upgradeBanner }: CheckoutSummaryProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const params = useParams<{ locale?: string }>()
    const [promotionDiscount, setPromotionDiscount] = useState<CheckoutDiscountValue | null>(null)
    if (!content || !subscriptionConfig || !subscriptionPrices) return null

    const deployment = searchParams.get("deploymentType") ?? searchParams.get("deployment")
    const customerType = searchParams.get("customerType")
    const resolvedCustomerType: SubscriptionCustomerType = customerType === "b2b" ? "b2b" : "b2c"
    const periodOptions = getPaymentPeriodOptions(resolvedCustomerType)
    const handlePeriodChange = (period: PaymentPeriod) => {
        const nextParams = new URLSearchParams(searchParams.toString())
        nextParams.set("paymentPeriod", period)
        router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false })
    }
    const planParam = searchParams.get("plan")
    const paymentPeriodParam = searchParams.get("paymentPeriod")
    const workflowExecutionsParam = searchParams.get("workflowExecutions")
    const aiTokensParam = searchParams.get("aiTokens")
    const { aiTokens, isCustomPlan, paymentPeriod, periodSuffix, planTitle, pricing, workflowExecutions } = resolveCheckoutPricing({
        aiTokensParam,
        customerTypeParam: customerType,
        fallbackPeriodSuffix: content.pricing.perMonthSuffix,
        paymentPeriodParam,
        planParam,
        subscriptionConfig,
        subscriptionPrices,
        workflowExecutionsParam,
    })
    const locale = params?.locale === "de" ? "de" : "en"
    const monthlyPeriodSuffix = subscriptionConfig?.paymentPeriod.monthlyPeriodSuffix ?? content.pricing.perMonthSuffix
    const paymentPeriodDiscountAmount = Math.max(0, pricing.totalBeforeDiscount - pricing.totalPrice)
    const paymentPeriodDiscountPercentage = pricing.totalBeforeDiscount > 0 ? paymentPeriodDiscountAmount / pricing.totalBeforeDiscount : 0
    const paymentPeriodDiscountLabel = paymentPeriod === "quarterly" ? content.pricing.quarterlyDiscountLabel : paymentPeriod === "yearly" ? content.pricing.yearlyDiscountLabel : null
    const paymentPeriodTotalPrice = pricing.totalPrice
    const promotionDiscountAmount = calculatePromotionDiscountAmount(paymentPeriodTotalPrice, promotionDiscount)
    const discountedPrice = Math.max(0, paymentPeriodTotalPrice - promotionDiscountAmount)
    const taxPercentage = taxQuote ? calculateExclusiveTaxRate(taxQuote.amountTotal, taxQuote.taxAmountExclusive) : 0
    const taxAmount = taxQuote ? Math.round(discountedPrice * taxPercentage * 100) / 100 : 0
    const totalPrice = discountedPrice + taxAmount
    const formattedBasePrice = formatEuroCurrency(pricing.aiTokenPrice, locale)
    const formattedWorkflowExecutionsPrice = formatEuroCurrency(pricing.workflowExecutionPrice, locale)
    const formattedPaymentPeriodDiscountAmount = formatEuroCurrency(paymentPeriodDiscountAmount, locale)
    const formattedDiscountAmount = formatEuroCurrency(promotionDiscountAmount, locale)
    const formattedTaxAmount = formatEuroCurrency(taxAmount, locale)

    return (
        <div className="flex-1">
            <div className="mb-6">
                <p className="tracking-wide text-brand">{content.eyebrow}</p>
                <h2 className="mt-4 text-2xl text-white">{content.heading}</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-secondary">{content.description}</p>
            </div>

            {subscriptionConfig && (
                <Switch
                    className="mt-4 mb-2"
                    label={subscriptionConfig.paymentPeriod.title}
                    value={paymentPeriod}
                    options={periodOptions.map((period) => {
                        const { pricing: periodPricing } = resolveCheckoutPricing({
                            aiTokensParam,
                            customerTypeParam: customerType,
                            fallbackPeriodSuffix: content.pricing.perMonthSuffix,
                            paymentPeriodParam: period,
                            planParam,
                            subscriptionConfig,
                            subscriptionPrices,
                            workflowExecutionsParam,
                        })

                        const discountAmount = Math.max(0, periodPricing.totalBeforeDiscount - periodPricing.totalPrice)

                        const discountPercentage = periodPricing.totalBeforeDiscount > 0 ? discountAmount / periodPricing.totalBeforeDiscount : 0

                        return {
                            value: period,
                            label: subscriptionConfig.paymentPeriod[`${period}Text`],
                            badge: discountPercentage > 0 ? `-${formatDiscountBadge(discountPercentage, locale)}` : null,
                        }
                    })}
                    onChange={handlePeriodChange}
                />
            )}

            <Card variant="light" className="mt-4 mb-2">
                <div className="-mx-4 flex items-center justify-between gap-3 border-b border-white/10 px-4 pb-3">
                    <div>
                        <p className="text-sm text-white">{content.pricing.label}</p>
                        <p className="mt-1 text-sm text-tertiary">{content.pricing.description}</p>
                    </div>
                </div>

                <div className="space-y-2 pt-4">
                    <span className="flex gap-2 text-secondary items-center text-sm">
                        {content.pricing.planLabel}

                        <SummaryBadge
                            icon={getIcon(planTitle === "Pro" ? subscriptionConfig.plan.pro.icon : planTitle === "Max" ? subscriptionConfig.plan.max.icon : subscriptionConfig.plan.custom.icon, 16)}
                            tone={planTitle === "Pro" ? subscriptionConfig.plan.pro.color : planTitle === "Max" ? subscriptionConfig.plan.max.color : subscriptionConfig.plan.custom.color}
                            value={<span className="capitalize">{planTitle.replaceAll("_", " ").replaceAll("-", " ")}</span>}
                        />
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

                    {isCustomPlan && (
                        <>
                            <div className="flex items-start justify-between gap-4 text-sm">
                                <span className="flex gap-2 text-secondary items-center">
                                    {content.pricing.baseLabel}{" "}
                                    <SummaryBadge
                                        icon={getIcon(content.aiTokensIcon, 16)}
                                        tone={content.aiTokensIconColor}
                                        value={
                                            <span>
                                                {formatCompactNumber(aiTokens)} {monthlyPeriodSuffix}
                                            </span>
                                        }
                                    />
                                </span>
                                <span className="shrink-0 tabular-nums text-white">{formattedBasePrice}</span>
                            </div>

                            <div className="flex items-start justify-between gap-4 text-sm">
                                <span className="flex gap-2 text-secondary items-center">
                                    {content.pricing.workflowExecutionsLabel}{" "}
                                    <SummaryBadge
                                        icon={getIcon(content.workflowExecutionsIcon, 16)}
                                        tone={content.workflowExecutionsIconColor}
                                        value={
                                            <span>
                                                {formatCompactNumber(workflowExecutions)} {monthlyPeriodSuffix}
                                            </span>
                                        }
                                    />
                                </span>
                                <span className="shrink-0 tabular-nums text-white">{formattedWorkflowExecutionsPrice}</span>
                            </div>
                        </>
                    )}

                    {paymentPeriodDiscountLabel && paymentPeriodDiscountAmount > 0 && (
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-secondary">
                                {paymentPeriodDiscountLabel} (-{formatDiscountBadge(paymentPeriodDiscountPercentage, locale)})
                            </span>
                            <span className="tabular-nums text-white">-{formattedPaymentPeriodDiscountAmount}</span>
                        </div>
                    )}

                    <div id="checkout-applied-discount" className="empty:hidden" aria-live="polite" />

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

                    <div className="flex items-center gap-2">
                        <NumberFlow
                            value={totalPrice}
                            className="text-brand text-lg"
                            locales={locale === "de" ? "de-DE" : "en-US"}
                            format={{ style: "currency", currency: "EUR", trailingZeroDisplay: "stripIfInteger" }}
                        />
                        <span className="text-tertiary text-sm">{periodSuffix}</span>
                    </div>
                </div>
            </Card>

            <CheckoutUpgradePlan content={upgradeBanner} subscriptionConfig={subscriptionConfig} />

            {errors && (
                <CheckoutDiscount
                    appliedAmount={promotionDiscountAmount > 0 ? formattedDiscountAmount : null}
                    appliedContainerId="checkout-applied-discount"
                    buttonLabel={content.pricing.discountButtonLabel}
                    discountSessionRequiredError={errors.discountSessionRequired}
                    discountValidationError={errors.discountValidation}
                    inputPlaceholder={content.pricing.discountInputPlaceholder}
                    onApplied={setPromotionDiscount}
                    promptLabel={content.pricing.discountPromptLabel}
                    removeLabel={content.pricing.discountRemoveLabel}
                />
            )}
        </div>
    )
}
