import type { PaymentPeriod, SubscriptionCustomerType, SubscriptionDeploymentMode, SubscriptionPlan, SubscriptionSelection } from "@/lib/subscription/types"
import type { SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { getSubscriptionCatalog, type SubscriptionCatalog } from "@/lib/subscription/catalog"
import { normalizePaymentPeriod, resolveSubscriptionSelection } from "@/lib/subscription/configurator"
import { getSubscriptionPriceAmount, type SubscriptionPriceCatalog, type SubscriptionPriceLookupKey } from "@/lib/subscription/prices"

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

export function getPaymentPeriodMonths(period: PaymentPeriod) {
    if (period === "quarterly") return 3
    if (period === "yearly") return 12
    return 1
}

export function getMonthlyEquivalentAmount(amount: number, period: PaymentPeriod) {
    return Math.round(amount / getPaymentPeriodMonths(period))
}

export function getSubscriptionDisplayPrices(totalAmount: number, period: PaymentPeriod) {
    return {
        monthlyPrice: getMonthlyEquivalentAmount(totalAmount, period) / 100,
        paymentPeriodPrice: totalAmount / 100,
    }
}

export function getPaymentPeriodSuffix(period: PaymentPeriod, paymentPeriod: SubscriptionConfigData["paymentPeriod"]) {
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

function getPriceKey(component: "pro" | "max" | "ai_token" | "workflow_execution", deployment: SubscriptionDeploymentMode, customerType: SubscriptionCustomerType, period: PaymentPeriod) {
    const priceComponent = component === "ai_token" ? "custom_ai_tokens" : component === "workflow_execution" ? "custom_workflow_executions" : component
    const priceDeployment = deployment === "self_hosted" ? "selfhosted" : "cloud"
    const priceCustomerType = customerType === "b2b" ? "business" : "personal"
    return `${priceComponent}_${priceDeployment}_${priceCustomerType}_${period}` as SubscriptionPriceLookupKey
}

function getPrice(config: SubscriptionCatalog, lookupKey: SubscriptionPriceLookupKey) {
    const price = config.subscriptionPrices[lookupKey]
    if (!price) throw new Error(`The subscription price catalog is missing ${lookupKey}.`)
    return price
}

export function calculateSubscriptionQuote(selection: SubscriptionSelection, config: SubscriptionCatalog): SubscriptionQuote {
    const months = getPaymentPeriodMonths(selection.paymentPeriod)

    if (selection.plan !== "custom") {
        const total = getSubscriptionPriceAmount(getPrice(config, getPriceKey(selection.plan, selection.deployment, selection.customerType, selection.paymentPeriod)))
        const regularTotal = months > 1 ? getSubscriptionPriceAmount(getPrice(config, getPriceKey(selection.plan, selection.deployment, selection.customerType, "monthly"))) * months : total
        const subtotal = Math.max(total, regularTotal)
        return {
            currency: "EUR",
            items: [{ id: selection.plan, type: "plan", amount: total }],
            subtotal,
            periodDiscount: subtotal - total,
            total,
        }
    }

    const aiTokenAmount = getSubscriptionPriceAmount(getPrice(config, getPriceKey("ai_token", selection.deployment, selection.customerType, selection.paymentPeriod)), selection.aiTokens)
    const workflowExecutionAmount = getSubscriptionPriceAmount(getPrice(config, getPriceKey("workflow_execution", selection.deployment, selection.customerType, selection.paymentPeriod)), selection.workflowExecutions)
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
        months > 1
            ? getSubscriptionPriceAmount(getPrice(config, getPriceKey("ai_token", selection.deployment, selection.customerType, "monthly")), selection.aiTokens) * months +
              getSubscriptionPriceAmount(getPrice(config, getPriceKey("workflow_execution", selection.deployment, selection.customerType, "monthly")), selection.workflowExecutions) * months
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
    deploymentTypeParam,
    fallbackPeriodSuffix,
    paymentPeriodParam,
    planParam,
    subscriptionConfig,
    subscriptionPrices,
    workflowExecutionsParam,
}: {
    aiTokensParam: string | null
    customerTypeParam: string | null
    deploymentTypeParam?: string | null
    fallbackPeriodSuffix: string
    paymentPeriodParam: string | null
    planParam: string | null
    subscriptionConfig?: SubscriptionConfigData | null
    subscriptionPrices?: SubscriptionPriceCatalog | null
    workflowExecutionsParam: string | null
}) {
    if (!subscriptionConfig || !subscriptionPrices) {
        const plan: SubscriptionPlan = planParam === "pro" || planParam === "max" ? planParam : "custom"
        const paymentPeriod: PaymentPeriod = normalizePaymentPeriod(paymentPeriodParam)
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
            deploymentType: deploymentTypeParam,
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
