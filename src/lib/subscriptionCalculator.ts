import type { SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { getSubscriptionCatalog, type SubscriptionCatalog } from "@/lib/subscriptionCatalog"
import { getSubscriptionPriceAmount, type SubscriptionPriceCatalog, type SubscriptionPriceLookupKey } from "@/lib/subscriptionPrices"
import { resolveSubscriptionSelection, type SubscriptionCustomerType, type SubscriptionSelection } from "@/lib/subscriptionConfigurator"

export type PaymentPeriod = "weekly" | "monthly" | "quarterly" | "yearly"
type SubscriptionPlan = "custom" | "pro" | "max"

const AVERAGE_WEEKS_PER_MONTH = 4.35
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
    if (period === "weekly") return 1
    if (period === "quarterly") return 3
    if (period === "yearly") return 12
    return 1
}

export function getMonthlyEquivalentAmount(amount: number, period: PaymentPeriod) {
    if (period === "weekly") return Math.round(amount * AVERAGE_WEEKS_PER_MONTH)
    return Math.round(amount / getPaymentPeriodMonths(period))
}

export function getPaymentPeriodAmount(monthlyAmount: number, period: PaymentPeriod) {
    const multiplier = period === "weekly" ? 1 / AVERAGE_WEEKS_PER_MONTH : period === "quarterly" ? 3 : period === "yearly" ? 12 : 1
    return Math.round(monthlyAmount * multiplier * 100) / 100
}

export function getPaymentPeriodSuffix(period: PaymentPeriod, paymentPeriod: SubscriptionConfigData["paymentPeriod"]) {
    if (period === "weekly") return paymentPeriod.weeklyPeriodSuffix
    if (period === "quarterly") return paymentPeriod.quarterlyPeriodSuffix
    if (period === "yearly") return paymentPeriod.yearlyPeriodSuffix
    return paymentPeriod.monthlyPeriodSuffix
}

const fromCents = (amount: number) => amount / 100

export type SubscriptionQuote = {
    currency: "EUR"
    items: { id: string; type: "plan" | "aiTokens" | "workflowExecutions"; amount: number }[]
    subtotal: number
    periodDiscount: number
    total: number
}

function getRegularPriceKey(plan: "pro" | "max", period: PaymentPeriod) {
    return `${plan}_${period}` as SubscriptionPriceLookupKey
}

function getCustomPriceKey(component: "ai_token" | "workflow_execution", customerType: SubscriptionCustomerType, period: PaymentPeriod) {
    return `${component}_${customerType}_${period}` as SubscriptionPriceLookupKey
}

export function calculateSubscriptionQuote(selection: SubscriptionSelection, config: SubscriptionCatalog): SubscriptionQuote {
    const months = getPaymentPeriodMonths(selection.paymentPeriod)

    if (selection.plan !== "custom") {
        const total = getSubscriptionPriceAmount(config.subscriptionPrices[getRegularPriceKey(selection.plan, selection.paymentPeriod)])
        const regularTotal = selection.paymentPeriod === "yearly" ? getSubscriptionPriceAmount(config.subscriptionPrices[getRegularPriceKey(selection.plan, "monthly")]) * months : total
        const subtotal = Math.max(total, regularTotal)
        return {
            currency: "EUR",
            items: [{ id: selection.plan, type: "plan", amount: total }],
            subtotal,
            periodDiscount: subtotal - total,
            total,
        }
    }

    const aiTokenAmount = getSubscriptionPriceAmount(config.subscriptionPrices[getCustomPriceKey("ai_token", selection.customerType, selection.paymentPeriod)], selection.aiTokens)
    const workflowExecutionAmount = getSubscriptionPriceAmount(
        config.subscriptionPrices[getCustomPriceKey("workflow_execution", selection.customerType, selection.paymentPeriod)],
        selection.workflowExecutions
    )
    const items: SubscriptionQuote["items"] = [
        {
            id: "aiTokens",
            type: "aiTokens",
            amount: aiTokenAmount,
        },
        {
            id: "workflowExecutions",
            type: "workflowExecutions",
            amount: workflowExecutionAmount,
        },
    ]
    const total = items.reduce((sum, item) => sum + item.amount, 0)
    const monthlyBaseline =
        selection.paymentPeriod === "quarterly" || selection.paymentPeriod === "yearly"
            ? getSubscriptionPriceAmount(config.subscriptionPrices[getCustomPriceKey("ai_token", selection.customerType, "monthly")], selection.aiTokens) * months +
              getSubscriptionPriceAmount(config.subscriptionPrices[getCustomPriceKey("workflow_execution", selection.customerType, "monthly")], selection.workflowExecutions) * months
            : aiTokenAmount + workflowExecutionAmount
    const subtotal = Math.max(total, monthlyBaseline)
    return { currency: "EUR", items, subtotal, periodDiscount: subtotal - total, total }
}

export function getSubscriptionQuoteDiscountRate(selection: SubscriptionSelection, config: SubscriptionCatalog) {
    const quote = calculateSubscriptionQuote(selection, config)
    return quote.subtotal > 0 ? quote.periodDiscount / quote.subtotal : 0
}

function parseNumber(value: string | null, fallback: number) {
    if (value === null || value.trim() === "") return fallback

    const parsedValue = Number(value)
    return Number.isFinite(parsedValue) ? parsedValue : fallback
}

export function resolveCheckoutPricing({
    aiTokensParam,
    customerTypeParam,
    fallbackPeriodSuffix,
    paymentPeriodParam,
    planParam,
    subscriptionConfig,
    subscriptionPrices,
    workflowExecutionsParam,
}: {
    aiTokensParam: string | null
    customerTypeParam: string | null
    fallbackPeriodSuffix: string
    paymentPeriodParam: string | null
    planParam: string | null
    subscriptionConfig?: SubscriptionConfigData | null
    subscriptionPrices?: SubscriptionPriceCatalog | null
    workflowExecutionsParam: string | null
}) {
    if (!subscriptionConfig || !subscriptionPrices) {
        const plan: SubscriptionPlan = planParam === "pro" || planParam === "max" ? planParam : "custom"
        const paymentPeriod: PaymentPeriod = PAYMENT_PERIODS.has(paymentPeriodParam as PaymentPeriod) ? (paymentPeriodParam as PaymentPeriod) : "monthly"
        return {
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

    const catalog = getSubscriptionCatalog(subscriptionConfig, subscriptionPrices)
    const { selection } = resolveSubscriptionSelection(
        {
            aiTokens: aiTokensParam,
            customerType: customerTypeParam,
            paymentPeriod: paymentPeriodParam,
            plan: planParam,
            workflowExecutions: workflowExecutionsParam,
        },
        catalog
    )
    const quote = calculateSubscriptionQuote(selection, catalog)
    const itemAmount = (type: SubscriptionQuote["items"][number]["type"]) => fromCents(quote.items.find((item) => item.type === type)?.amount ?? 0)
    const pricing = {
        aiTokenPrice: itemAmount("aiTokens"),
        totalBeforeDiscount: fromCents(quote.subtotal),
        totalPrice: fromCents(quote.total),
        workflowExecutionPrice: itemAmount("workflowExecutions"),
    }
    return {
        aiTokens: selection.plan === "custom" ? selection.aiTokens : 0,
        isCustomPlan: selection.plan === "custom",
        paymentPeriod: selection.paymentPeriod,
        periodSuffix: getPaymentPeriodSuffix(selection.paymentPeriod, subscriptionConfig.paymentPeriod),
        plan: selection.plan,
        planPrice: selection.plan === "custom" ? null : fromCents(quote.total),
        planTitle: subscriptionConfig.packages[selection.plan].title,
        pricing,
        workflowExecutions: selection.plan === "custom" ? selection.workflowExecutions : 0,
    }
}
