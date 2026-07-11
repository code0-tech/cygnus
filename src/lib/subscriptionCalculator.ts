import type { SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"

export type PaymentPeriod = "monthly" | "quarterly" | "yearly"

export type UsageRange = {
    min: number
    max: number
    step: number
}

export function clampToRange(value: number, range: UsageRange) {
    return Math.min(Math.max(value, range.min), range.max)
}

export function formatDiscountBadge(discount: number, locale: AppLocale) {
    return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", {
        style: "percent",
        maximumFractionDigits: 0,
    }).format(discount)
}

export function getPaymentPeriodDiscount(period: PaymentPeriod, paymentPeriod: SubscriptionConfigData["paymentPeriod"]) {
    if (period === "quarterly") return paymentPeriod.quarterlyDiscount
    if (period === "yearly") return paymentPeriod.yearlyDiscount
    return 0
}

export function getPaymentPeriodSuffix(period: PaymentPeriod, paymentPeriod: SubscriptionConfigData["paymentPeriod"]) {
    if (period === "quarterly") return paymentPeriod.quarterlyPeriodSuffix
    if (period === "yearly") return paymentPeriod.yearlyPeriodSuffix
    return paymentPeriod.monthlyPeriodSuffix
}

export function calculateSubscriptionPrice({
    additionalFeaturesPrice = 0,
    aiTokenPriceFactor,
    aiTokens,
    discount = 0,
    workflowExecutionPriceFactor,
    workflowExecutions,
}: {
    additionalFeaturesPrice?: number
    aiTokenPriceFactor: number
    aiTokens: number
    discount?: number
    workflowExecutionPriceFactor: number
    workflowExecutions: number
}) {
    const workflowExecutionPrice = workflowExecutionPriceFactor * workflowExecutions
    const aiTokenPrice = aiTokenPriceFactor * aiTokens
    const totalBeforeDiscount = workflowExecutionPrice + aiTokenPrice + additionalFeaturesPrice

    return {
        aiTokenPrice,
        totalBeforeDiscount,
        totalPrice: totalBeforeDiscount * (1 - discount),
        workflowExecutionPrice,
    }
}
