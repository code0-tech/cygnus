"use client"

import { useOptionalCheckoutFormState } from "@/components/checkout/form/CheckoutFormProvider"
import type { CheckoutTaxStatus } from "@/components/checkout/summary/CheckoutPricingOverview"
import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"
import { formatCurrency } from "@/lib/formatters"
import type { AppLocale } from "@/lib/i18n"
import { calculateExclusiveTaxRate, formatDiscountBadge, getMonthlyEquivalentAmount, getPaymentPeriodMonths, resolveCheckoutPricing } from "@/lib/subscription/calculator"
import type { SubscriptionPriceCatalog } from "@/lib/subscription/prices"
import { PAYMENT_PERIOD_OPTIONS, type PaymentPeriod } from "@/lib/subscription/types"
import type { CheckoutPackages } from "@/lib/subscription/usagePackages"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

interface CheckoutPricingInput {
    checkoutPackages: CheckoutPackages
    content?: CheckoutData["summary"] | null
    locale: AppLocale
    subscriptionConfig?: SubscriptionConfigData | null
    subscriptionPrices?: SubscriptionPriceCatalog | null
}

export interface CheckoutPeriodOption {
    discountBadge: string | null
    label: string
    monthlyPriceLabel: string
    period: PaymentPeriod
}

/**
 * Derives the checkout pricing from the URL configuration, refined by Stripe's session pricing or the tax quote once
 * the checkout form has them. Shared by the summary and the mobile checkout bar so both always show the same total.
 * Returns `null` while the CMS content is missing.
 */
export function useCheckoutPricing({ checkoutPackages, content, locale, subscriptionConfig, subscriptionPrices }: CheckoutPricingInput) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const formState = useOptionalCheckoutFormState()
    if (!content || !subscriptionConfig || !subscriptionPrices) return null

    const stripePricing = formState?.stripePricing ?? null
    const taxQuote = formState?.taxQuote ?? null
    const deployment = searchParams.get("deploymentType") ?? searchParams.get("deployment")
    const customerType = searchParams.get("customerType")
    const pricingParams = {
        aiTokensParam: searchParams.get("aiTokens"),
        checkoutPackages,
        customerTypeParam: customerType,
        deploymentTypeParam: deployment,
        fallbackPeriodSuffix: content.pricing.perMonthSuffix,
        planParam: searchParams.get("plan"),
        subscriptionConfig,
        subscriptionPrices,
        workflowExecutionsParam: searchParams.get("workflowExecutions"),
    }
    const { aiTokens, paymentPeriod, plan, planTitle, pricing, workflowExecutions } = resolveCheckoutPricing({ ...pricingParams, paymentPeriodParam: searchParams.get("paymentPeriod") })

    const previewTaxPercentage = taxQuote ? calculateExclusiveTaxRate(taxQuote.amountTotal, taxQuote.taxAmountExclusive) : 0
    const previewTaxAmount = taxQuote ? Math.round(pricing.totalPrice * previewTaxPercentage * 100) / 100 : 0
    const currency = stripePricing?.currency ?? "EUR"
    const discountAmount = stripePricing?.discountAmount ?? 0
    const taxAmount = stripePricing?.taxAmount ?? previewTaxAmount
    const taxAmountInclusive = stripePricing?.taxAmountInclusive ?? 0
    const hasMixedTax = taxAmount > 0 && taxAmountInclusive > 0
    const taxPercentage = hasMixedTax ? null : stripePricing ? calculateExclusiveTaxRate(stripePricing.totalPrice, stripePricing.taxAmount) : taxQuote ? previewTaxPercentage : null
    const taxPercentageInclusive = stripePricing && !hasMixedTax ? calculateExclusiveTaxRate(stripePricing.totalPrice, taxAmountInclusive) : null
    const totalPrice = stripePricing?.totalPrice ?? pricing.totalPrice + previewTaxAmount

    const includedQuantities = plan === "custom" ? { aiTokens, workflowExecutions } : checkoutPackages.planQuantities[plan]
    const deploymentTitle = deployment === "cloud" ? subscriptionConfig.deployment.cloud.title : deployment === "self_hosted" ? subscriptionConfig.deployment.selfHosted.title : null
    const customerTypeTitle = customerType === "b2b" || customerType === "b2c" ? subscriptionConfig.customerType[customerType].title : null
    const lineItemDetails = [deploymentTitle, customerTypeTitle].filter(Boolean).join(", ")
    const periodStart = new Date()
    const periodEnd = new Date(periodStart)
    periodEnd.setMonth(periodEnd.getMonth() + getPaymentPeriodMonths(paymentPeriod))
    const taxStatus: CheckoutTaxStatus = stripePricing || taxQuote ? "ready" : formState?.checkoutSession && !formState.stripeCheckoutReady ? "loading" : "unknown"
    const dateFormatter = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "short", year: "numeric" })
    const monthlyPeriodSuffix = subscriptionConfig.paymentPeriod.monthlyPeriodSuffix ?? content.pricing.perMonthSuffix

    const periodOptions: CheckoutPeriodOption[] = PAYMENT_PERIOD_OPTIONS.map((period) => {
        const { pricing: periodPricing } = resolveCheckoutPricing({ ...pricingParams, paymentPeriodParam: period })
        const periodDiscount = Math.max(0, periodPricing.totalBeforeDiscount - periodPricing.totalPrice)
        const discountPercentage = periodPricing.totalBeforeDiscount > 0 ? periodDiscount / periodPricing.totalBeforeDiscount : 0
        const monthlyPrice = getMonthlyEquivalentAmount(Math.round(periodPricing.totalPrice * 100), period) / 100
        return {
            discountBadge: discountPercentage > 0 ? `-${formatDiscountBadge(discountPercentage, locale)}` : null,
            label: subscriptionConfig.paymentPeriod[`${period}Text`],
            monthlyPriceLabel: `${formatCurrency(monthlyPrice, currency, locale)} ${monthlyPeriodSuffix}`,
            period,
        }
    })

    const setPaymentPeriod = (period: PaymentPeriod) => {
        const nextParams = new URLSearchParams(searchParams.toString())
        nextParams.set("paymentPeriod", period)
        router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false })
    }

    return {
        currency,
        discountAmount,
        formattedDiscountAmount: formatCurrency(discountAmount, currency, locale),
        hasTax: taxAmount > 0 || taxAmountInclusive > 0,
        nextChargeText: content.nextChargeText.replaceAll("{date}", dateFormatter.format(periodEnd)),
        overview: {
            aiTokens: includedQuantities.aiTokens,
            billingCountry: stripePricing?.billingCountry ?? null,
            currency,
            lineItemAmount: pricing.totalPrice,
            lineItemLabel: lineItemDetails ? `${planTitle} (${lineItemDetails})` : planTitle,
            periodEnd,
            periodStart,
            planDescription: subscriptionConfig.plan[plan].description,
            planTitle,
            subtotalPrice: stripePricing?.subtotalPrice ?? pricing.totalPrice,
            taxAmount,
            taxAmountInclusive,
            taxLines: stripePricing?.taxLines ?? [],
            taxPercentage,
            taxPercentageInclusive,
            taxStatus,
            totalPrice,
            workflowExecutions: includedQuantities.workflowExecutions,
        },
        paymentPeriod,
        periodOptions,
        planTitle,
        setPaymentPeriod,
        totalPrice,
    }
}

export type CheckoutPricing = NonNullable<ReturnType<typeof useCheckoutPricing>>
