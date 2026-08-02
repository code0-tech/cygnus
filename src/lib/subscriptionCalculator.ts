import type { SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import type { SubscriptionCatalog } from "@/lib/subscriptionCatalog"
import { resolveSubscriptionSelection, type SubscriptionCustomerType, type SubscriptionSelection } from "@/lib/subscriptionConfigurator"

export type PaymentPeriod = "weekly" | "monthly" | "quarterly" | "yearly"
type SubscriptionPlan = "custom" | "pro" | "max"

const AVERAGE_WEEKS_PER_MONTH = 4.345
const PAYMENT_PERIODS = new Set<PaymentPeriod>(["weekly", "monthly", "quarterly", "yearly"])

export type UsageRange = {
    min: number
    max: number
    step: number
}

export function formatDiscountBadge(discount: number, locale: AppLocale) {
    return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", {
        style: "percent",
        maximumFractionDigits: 0,
    }).format(discount)
}

export function calculateExclusiveTaxRate(amountTotal: number, taxAmountExclusive: number) {
    const amountBeforeTax = amountTotal - taxAmountExclusive
    return amountBeforeTax > 0 ? taxAmountExclusive / amountBeforeTax : 0
}

export function calculatePromotionDiscountAmount(
    total: number,
    discount: {
        amountOff: number | null
        percentOff: number | null
    } | null
) {
    if (!discount || total <= 0) return 0

    if (discount.amountOff !== null && Number.isFinite(discount.amountOff)) {
        return Math.min(total, Math.max(0, discount.amountOff / 100))
    }

    if (discount.percentOff !== null && Number.isFinite(discount.percentOff)) {
        return total * (Math.min(100, Math.max(0, discount.percentOff)) / 100)
    }

    return 0
}

export function getPaymentPeriodDiscount(period: PaymentPeriod, paymentPeriod: SubscriptionConfigData["paymentPeriod"], customerType: SubscriptionCustomerType) {
    if (period === "quarterly") return paymentPeriod.quarterlyDiscount
    if (period === "yearly") return paymentPeriod.yearlyDiscount
    // B2C bills weekly as the base rate, so monthly is a discount off the weekly-equivalent price instead of the other way around.
    if (period === "monthly" && customerType === "b2c") return paymentPeriod.monthlyDiscount
    return 0
}

export function getPaymentPeriodMonths(period: PaymentPeriod) {
    if (period === "weekly") return 1 / AVERAGE_WEEKS_PER_MONTH
    if (period === "quarterly") return 3
    if (period === "yearly") return 12
    return 1
}

export function getMonthlyEquivalentAmount(amount: number, period: PaymentPeriod) {
    return Math.round(amount / getPaymentPeriodMonths(period))
}

export function getPaymentPeriodSuffix(period: PaymentPeriod, paymentPeriod: SubscriptionConfigData["paymentPeriod"]) {
    if (period === "weekly") return paymentPeriod.weeklyPeriodSuffix
    if (period === "quarterly") return paymentPeriod.quarterlyPeriodSuffix
    if (period === "yearly") return paymentPeriod.yearlyPeriodSuffix
    return paymentPeriod.monthlyPeriodSuffix
}

const toCents = (amount: number) => Math.round(amount * 100)
const fromCents = (amount: number) => amount / 100

export type SubscriptionQuote = {
    currency: "EUR"
    items: { id: string; type: "plan" | "aiTokens" | "workflowExecutions" | "additionalFeature"; amount: number }[]
    subtotal: number
    periodDiscount: number
    total: number
}

export function calculateSubscriptionQuote(selection: SubscriptionSelection, config: SubscriptionCatalog): SubscriptionQuote {
    const months = getPaymentPeriodMonths(selection.paymentPeriod)

    if (selection.plan !== "custom") {
        const total = toCents(config.packages[selection.plan].prices[selection.paymentPeriod])
        const regularTotal = toCents(config.packages[selection.plan].prices.monthly * months)
        const subtotal = Math.max(total, regularTotal)
        return {
            currency: "EUR",
            items: [{ id: selection.plan, type: "plan", amount: subtotal }],
            subtotal,
            periodDiscount: subtotal - total,
            total,
        }
    }

    const isWeekly = selection.paymentPeriod === "weekly"
    const items: SubscriptionQuote["items"] = [
        {
            id: "aiTokens",
            type: "aiTokens",
            amount: toCents(isWeekly ? config.aiTokenWeeklyPriceFactor * selection.aiTokens : config.aiTokenPriceFactor * selection.aiTokens * months),
        },
        {
            id: "workflowExecutions",
            type: "workflowExecutions",
            amount: toCents(isWeekly ? config.workflowExecutionWeeklyPriceFactor * selection.workflowExecutions : config.workflowExecutionPriceFactor * selection.workflowExecutions * months),
        },
        ...(config.additionalFeatures ?? [])
            .filter((feature) => Boolean(feature.id && selection.additionalFeatureIds.includes(feature.id)))
            .map((feature) => ({ id: feature.id!, type: "additionalFeature" as const, amount: toCents(isWeekly ? feature.weeklyPrice : feature.price * months) })),
    ]
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
    const discountRate = getPaymentPeriodDiscount(selection.paymentPeriod, config.paymentPeriod, selection.customerType)
    const periodDiscount = Math.round(subtotal * discountRate)
    return { currency: "EUR", items, subtotal, periodDiscount, total: subtotal - periodDiscount }
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
    planParam,
    subscriptionConfig,
    workflowExecutionsParam,
}: {
    additionalFeatureIds: string[]
    aiTokensParam: string | null
    customerTypeParam: string | null
    fallbackPeriodSuffix: string
    paymentPeriodParam: string | null
    planParam: string | null
    subscriptionConfig?: SubscriptionConfigData | null
    workflowExecutionsParam: string | null
}) {
    if (!subscriptionConfig) {
        const plan: SubscriptionPlan = planParam === "pro" || planParam === "max" ? planParam : "custom"
        const paymentPeriod: PaymentPeriod = PAYMENT_PERIODS.has(paymentPeriodParam as PaymentPeriod) ? (paymentPeriodParam as PaymentPeriod) : "monthly"
        return {
            additionalFeaturesPrice: 0,
            aiTokens: parseNumber(aiTokensParam, 0),
            isCustomPlan: plan === "custom",
            paymentPeriod,
            periodSuffix: fallbackPeriodSuffix,
            plan,
            planPrice: plan === "custom" ? null : 0,
            planTitle: plan.charAt(0).toUpperCase() + plan.slice(1),
            pricing: { aiTokenPrice: 0, totalBeforeDiscount: 0, totalPrice: 0, workflowExecutionPrice: 0 },
            selectedAdditionalFeatures: [],
            workflowExecutions: parseNumber(workflowExecutionsParam, 0),
        }
    }

    const { selection } = resolveSubscriptionSelection(
        {
            additionalFeatures: additionalFeatureIds.join(","),
            aiTokens: aiTokensParam,
            customerType: customerTypeParam,
            paymentPeriod: paymentPeriodParam,
            plan: planParam,
            workflowExecutions: workflowExecutionsParam,
        },
        subscriptionConfig
    )
    const quote = calculateSubscriptionQuote(selection, subscriptionConfig)
    const itemAmount = (type: SubscriptionQuote["items"][number]["type"]) => fromCents(quote.items.find((item) => item.type === type)?.amount ?? 0)
    const selectedAdditionalFeatures = (subscriptionConfig.additionalFeatures ?? []).filter((feature) => Boolean(feature.id && selection.additionalFeatureIds.includes(feature.id)))
    const additionalFeaturesPrice = fromCents(quote.items.filter((item) => item.type === "additionalFeature").reduce((sum, item) => sum + item.amount, 0))
    const pricing = {
        aiTokenPrice: itemAmount("aiTokens"),
        totalBeforeDiscount: fromCents(quote.subtotal),
        totalPrice: fromCents(quote.total),
        workflowExecutionPrice: itemAmount("workflowExecutions"),
    }
    return {
        additionalFeaturesPrice,
        aiTokens: selection.plan === "custom" ? selection.aiTokens : 0,
        isCustomPlan: selection.plan === "custom",
        paymentPeriod: selection.paymentPeriod,
        periodSuffix: getPaymentPeriodSuffix(selection.paymentPeriod, subscriptionConfig.paymentPeriod),
        plan: selection.plan,
        planPrice: selection.plan === "custom" ? null : fromCents(quote.total),
        planTitle: subscriptionConfig.packages[selection.plan].title,
        pricing,
        selectedAdditionalFeatures,
        workflowExecutions: selection.plan === "custom" ? selection.workflowExecutions : 0,
    }
}
