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

function parseNumber(value: string | null, fallback: number) {
    if (value === null || value.trim() === "") return fallback

    const parsedValue = Number(value)
    return Number.isFinite(parsedValue) ? parsedValue : fallback
}

export function resolveCheckoutPricing({
    additionalFeatureIds,
    aiTokensParam,
    customerTypeParam,
    fallbackPeriodSuffix,
    paymentPeriodParam,
    subscriptionConfig,
    workflowExecutionsParam,
}: {
    additionalFeatureIds: string[]
    aiTokensParam: string | null
    customerTypeParam: string | null
    fallbackPeriodSuffix: string
    paymentPeriodParam: string | null
    subscriptionConfig?: SubscriptionConfigData | null
    workflowExecutionsParam: string | null
}) {
    const selectedAdditionalFeatures = additionalFeatureIds.flatMap((selectedFeatureId) => {
        const matchingFeature = subscriptionConfig?.additionalFeatures?.find((feature, index) => String(feature.id ?? index) === selectedFeatureId)
        return matchingFeature ? [matchingFeature] : []
    })
    const additionalFeaturesPrice = selectedAdditionalFeatures.reduce((total, feature) => total + feature.price, 0)
    const customerType = customerTypeParam === "b2b" || customerTypeParam === "b2c" ? customerTypeParam : (subscriptionConfig?.defaults.customerType ?? "b2b")
    const paymentPeriod: PaymentPeriod =
        paymentPeriodParam === "quarterly" || paymentPeriodParam === "yearly" || paymentPeriodParam === "monthly" ? paymentPeriodParam : (subscriptionConfig?.defaults.paymentPeriod ?? "monthly")
    const defaultWorkflowExecutions = subscriptionConfig?.defaults.workflowExecutions[customerType] ?? 200
    const defaultAiTokens = subscriptionConfig?.defaults.aiTokens[customerType] ?? 0
    const workflowExecutions = subscriptionConfig
        ? clampToRange(parseNumber(workflowExecutionsParam, defaultWorkflowExecutions), subscriptionConfig.workflowExecutions[customerType])
        : parseNumber(workflowExecutionsParam, defaultWorkflowExecutions)
    const aiTokens = subscriptionConfig ? clampToRange(parseNumber(aiTokensParam, defaultAiTokens), subscriptionConfig.aiTokens[customerType]) : parseNumber(aiTokensParam, defaultAiTokens)
    const discount = subscriptionConfig ? getPaymentPeriodDiscount(paymentPeriod, subscriptionConfig.paymentPeriod) : 0
    const pricing = calculateSubscriptionPrice({
        additionalFeaturesPrice,
        aiTokenPriceFactor: subscriptionConfig?.aiTokenPriceFactor ?? 0,
        aiTokens,
        discount,
        workflowExecutionPriceFactor: subscriptionConfig?.workflowExecutionPriceFactor ?? 0,
        workflowExecutions,
    })
    const periodSuffix = subscriptionConfig ? getPaymentPeriodSuffix(paymentPeriod, subscriptionConfig.paymentPeriod) : fallbackPeriodSuffix

    return {
        additionalFeaturesPrice,
        aiTokens,
        paymentPeriod,
        periodSuffix,
        pricing,
        selectedAdditionalFeatures,
        workflowExecutions,
    }
}
