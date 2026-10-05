import type { CheckoutPrice } from "@code0-tech/crater-graphql-types"

export const SUBSCRIPTION_PRICE_LOOKUP_KEYS = [
    "pro_cloud_business_monthly",
    "pro_cloud_business_quarterly",
    "pro_cloud_business_yearly",
    "pro_cloud_personal_monthly",
    "pro_cloud_personal_quarterly",
    "pro_cloud_personal_yearly",
    "max_cloud_business_monthly",
    "max_cloud_business_quarterly",
    "max_cloud_business_yearly",
    "max_cloud_personal_monthly",
    "max_cloud_personal_quarterly",
    "max_cloud_personal_yearly",
    "custom_ai_tokens_cloud_business_monthly",
    "custom_ai_tokens_cloud_business_quarterly",
    "custom_ai_tokens_cloud_business_yearly",
    "custom_ai_tokens_cloud_personal_monthly",
    "custom_ai_tokens_cloud_personal_quarterly",
    "custom_ai_tokens_cloud_personal_yearly",
    "custom_workflow_executions_cloud_business_monthly",
    "custom_workflow_executions_cloud_business_quarterly",
    "custom_workflow_executions_cloud_business_yearly",
    "custom_workflow_executions_cloud_personal_monthly",
    "custom_workflow_executions_cloud_personal_quarterly",
    "custom_workflow_executions_cloud_personal_yearly",
    "pro_selfhosted_business_monthly",
    "pro_selfhosted_business_quarterly",
    "pro_selfhosted_business_yearly",
    "pro_selfhosted_personal_monthly",
    "pro_selfhosted_personal_quarterly",
    "pro_selfhosted_personal_yearly",
    "max_selfhosted_business_monthly",
    "max_selfhosted_business_quarterly",
    "max_selfhosted_business_yearly",
    "max_selfhosted_personal_monthly",
    "max_selfhosted_personal_quarterly",
    "max_selfhosted_personal_yearly",
    "custom_ai_tokens_selfhosted_business_monthly",
    "custom_ai_tokens_selfhosted_business_quarterly",
    "custom_ai_tokens_selfhosted_business_yearly",
    "custom_ai_tokens_selfhosted_personal_monthly",
    "custom_ai_tokens_selfhosted_personal_quarterly",
    "custom_ai_tokens_selfhosted_personal_yearly",
    "custom_workflow_executions_selfhosted_business_monthly",
    "custom_workflow_executions_selfhosted_business_quarterly",
    "custom_workflow_executions_selfhosted_business_yearly",
    "custom_workflow_executions_selfhosted_personal_monthly",
    "custom_workflow_executions_selfhosted_personal_quarterly",
    "custom_workflow_executions_selfhosted_personal_yearly",
] as const

export type SubscriptionPriceLookupKey = (typeof SUBSCRIPTION_PRICE_LOOKUP_KEYS)[number]

export type SubscriptionPrice = {
    currency: string
    id: string
    interval: string
    intervalCount: number
    lookupKey: SubscriptionPriceLookupKey
    productName: string | null
    unitAmountDecimal: string
}

export type SubscriptionPriceCatalog = Record<SubscriptionPriceLookupKey, SubscriptionPrice>

const subscriptionPriceLookupKeys = new Set<string>(SUBSCRIPTION_PRICE_LOOKUP_KEYS)

function getExpectedRecurringPeriod(lookupKey: SubscriptionPriceLookupKey) {
    if (lookupKey.endsWith("_quarterly")) return { interval: "month", intervalCount: 3 }
    if (lookupKey.endsWith("_yearly")) return { interval: "year", intervalCount: 1 }
    return { interval: "month", intervalCount: 1 }
}

export function normalizeSubscriptionPrices(prices: CheckoutPrice[] | null | undefined): SubscriptionPriceCatalog {
    const normalizedPrices = new Map<SubscriptionPriceLookupKey, SubscriptionPrice>()

    for (const price of prices ?? []) {
        if (!price.lookupKey || !subscriptionPriceLookupKeys.has(price.lookupKey)) continue
        const lookupKey = price.lookupKey as SubscriptionPriceLookupKey
        if (normalizedPrices.has(lookupKey)) throw new Error(`Crater returned the subscription price ${lookupKey} more than once.`)
        if (!price.id || !price.currency || !price.interval || !price.intervalCount || price.unitAmountDecimal == null) {
            throw new Error(`Crater returned incomplete data for subscription price ${lookupKey}.`)
        }
        if (price.currency.toLowerCase() !== "eur") throw new Error(`Subscription price ${lookupKey} must use EUR.`)
        const expectedPeriod = getExpectedRecurringPeriod(lookupKey)
        if (price.interval !== expectedPeriod.interval || price.intervalCount !== expectedPeriod.intervalCount) {
            throw new Error(`Subscription price ${lookupKey} has an unexpected recurring interval.`)
        }

        normalizedPrices.set(lookupKey, {
            currency: price.currency.toLowerCase(),
            id: price.id,
            interval: price.interval,
            intervalCount: price.intervalCount,
            lookupKey,
            productName: price.productName ?? null,
            unitAmountDecimal: price.unitAmountDecimal,
        })
    }

    const missingLookupKeys = SUBSCRIPTION_PRICE_LOOKUP_KEYS.filter((lookupKey) => !normalizedPrices.has(lookupKey))
    if (missingLookupKeys.length) throw new Error(`Crater did not return required subscription prices: ${missingLookupKeys.join(", ")}.`)

    return Object.fromEntries(normalizedPrices) as SubscriptionPriceCatalog
}

export function getSubscriptionPriceAmount(price: SubscriptionPrice, quantity = 1) {
    if (!Number.isSafeInteger(quantity) || quantity < 0) throw new Error("Subscription price quantity must be a non-negative safe integer.")
    if (!/^\d+(?:\.\d+)?$/.test(price.unitAmountDecimal)) throw new Error(`Subscription price ${price.lookupKey} has an invalid amount.`)

    const [whole, fraction = ""] = price.unitAmountDecimal.split(".")
    const scale = BigInt(10) ** BigInt(fraction.length)
    const scaledUnitAmount = BigInt(`${whole}${fraction}`)
    const scaledTotal = scaledUnitAmount * BigInt(quantity)
    const roundedTotal = (scaledTotal + scale / BigInt(2)) / scale
    if (roundedTotal > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(`Subscription price ${price.lookupKey} exceeds the supported amount.`)
    return Number(roundedTotal)
}
