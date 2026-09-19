import type { CheckoutPrice } from "@code0-tech/crater-graphql-types"

export const SUBSCRIPTION_PRICE_LOOKUP_KEYS = [
    "pro_b2b_monthly",
    "pro_b2b_quarterly",
    "pro_b2b_yearly",
    "pro_b2c_monthly",
    "pro_b2c_quarterly",
    "pro_b2c_yearly",
    "max_b2b_monthly",
    "max_b2b_quarterly",
    "max_b2b_yearly",
    "max_b2c_monthly",
    "max_b2c_quarterly",
    "max_b2c_yearly",
    "ai_token_b2b_monthly",
    "ai_token_b2b_quarterly",
    "ai_token_b2b_yearly",
    "ai_token_b2c_monthly",
    "ai_token_b2c_quarterly",
    "ai_token_b2c_yearly",
    "workflow_execution_b2b_monthly",
    "workflow_execution_b2b_quarterly",
    "workflow_execution_b2b_yearly",
    "workflow_execution_b2c_monthly",
    "workflow_execution_b2c_quarterly",
    "workflow_execution_b2c_yearly",
] as const

export type SubscriptionPriceLookupKey = (typeof SUBSCRIPTION_PRICE_LOOKUP_KEYS)[number]

export type PricingPeriod = "monthly" | "quarterly" | "yearly"

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
