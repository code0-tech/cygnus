"use client"

import { CheckoutDiscount, type CheckoutDiscountValue } from "@/components/checkout/CheckoutDiscount"
import { CheckoutNextSteps } from "@/components/checkout/CheckoutNextSteps"
import { CheckoutPricingOverview } from "@/components/checkout/CheckoutPricingOverview"
import { useCheckoutStage } from "@/components/checkout/CheckoutStage"
import { UpgradePlanBanner, type SubscriptionPlan } from "@/components/checkout/UpgradePlanBanner"
import { Switch } from "@/components/ui/Switch"
import type { CheckoutTaxQuoteData } from "@/lib/checkout/checkoutSubmission"
import type { CheckoutData, ErrorsContent, SubscriptionConfigData, UpgradeBannerData } from "@/lib/cms"
import { formatEuroCurrency } from "@/lib/formatters"
import { calculateExclusiveTaxRate, calculatePromotionDiscountAmount, formatDiscountBadge, resolveCheckoutPricing, type PaymentPeriod } from "@/lib/subscriptionCalculator"
import { getPaymentPeriodOptions, type SubscriptionCustomerType } from "@/lib/subscriptionConfigurator"
import type { SubscriptionPriceCatalog } from "@/lib/subscriptionPrices"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

interface CheckoutSummaryProps {
    content?: CheckoutData["summary"] | null
    errors?: ErrorsContent | null
    nextSteps?: CheckoutData["nextSteps"] | null
    subscriptionConfig?: SubscriptionConfigData | null
    subscriptionPrices: SubscriptionPriceCatalog
    taxQuote?: CheckoutTaxQuoteData | null
    upgradeBanner?: UpgradeBannerData | null
}

export function CheckoutSummary({ content, errors, nextSteps, subscriptionConfig, subscriptionPrices, taxQuote, upgradeBanner }: CheckoutSummaryProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const params = useParams<{ locale?: string }>()
    const { stage } = useCheckoutStage()
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
    const handleUpgradePlan = (nextPlan: SubscriptionPlan) => {
        const nextSearchParams = new URLSearchParams(searchParams.toString())
        nextSearchParams.set("plan", nextPlan)
        nextSearchParams.delete("aiTokens")
        nextSearchParams.delete("workflowExecutions")
        router.push(`/${locale}/checkout?${nextSearchParams.toString()}`)
    }
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
    const formattedDiscountAmount = formatEuroCurrency(promotionDiscountAmount, locale)

    return (
        <div className="flex-1">
            {stage === "payment" ? (
                <CheckoutNextSteps content={nextSteps} />
            ) : (
                <>
                    <div className="mb-6">
                        <p className="tracking-wide text-brand">{content.eyebrow}</p>
                        <h2 className="mt-4 text-2xl text-white">{content.heading}</h2>
                        <p className="mt-2 max-w-md text-sm leading-6 text-secondary">{content.description}</p>
                    </div>

                    {subscriptionConfig && (
                        <Switch
                            className="mt-4 mb-2 text-sm"
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
                </>
            )}

            <CheckoutPricingOverview
                aiTokenPrice={pricing.aiTokenPrice}
                aiTokens={aiTokens}
                content={content}
                customerType={customerType}
                deployment={deployment}
                isCustomPlan={isCustomPlan}
                locale={locale}
                monthlyPeriodSuffix={monthlyPeriodSuffix}
                paymentPeriodDiscountAmount={paymentPeriodDiscountAmount}
                paymentPeriodDiscountLabel={paymentPeriodDiscountLabel}
                paymentPeriodDiscountPercentage={paymentPeriodDiscountPercentage}
                periodSuffix={periodSuffix}
                planTitle={planTitle}
                subscriptionConfig={subscriptionConfig}
                taxAmount={taxAmount}
                taxPercentage={taxQuote ? taxPercentage : null}
                totalPrice={totalPrice}
                workflowExecutionPrice={pricing.workflowExecutionPrice}
                workflowExecutions={workflowExecutions}
            />

            <UpgradePlanBanner content={upgradeBanner} currentPlan={planParam} onUpgrade={handleUpgradePlan} subscriptionConfig={subscriptionConfig} />

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
