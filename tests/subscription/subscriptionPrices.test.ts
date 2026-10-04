import assert from "node:assert/strict"
import test from "node:test"
import { getSubscriptionPriceAmount, normalizeSubscriptionPrices, SUBSCRIPTION_PRICE_LOOKUP_KEYS } from "@/lib/subscription/prices"
import type { CheckoutPrice } from "@code0-tech/crater-graphql-types"

function createPrices(): CheckoutPrice[] {
    return SUBSCRIPTION_PRICE_LOOKUP_KEYS.map((lookupKey) => ({
        currency: "eur",
        id: `price_${lookupKey}`,
        interval: lookupKey.endsWith("yearly") ? "year" : "month",
        intervalCount: lookupKey.endsWith("quarterly") ? 3 : 1,
        lookupKey,
        productName: lookupKey,
        unitAmount: lookupKey.startsWith("custom_ai_tokens") ? null : 1,
        unitAmountDecimal: lookupKey.startsWith("custom_ai_tokens") ? "0.001" : "1",
    }))
}

test("normalizes the complete Crater subscription price list by lookup key", () => {
    const catalog = normalizeSubscriptionPrices([...createPrices(), { id: "price_unrelated", lookupKey: null, productName: "Unrelated" }])

    assert.deepEqual(Object.keys(catalog), [...SUBSCRIPTION_PRICE_LOOKUP_KEYS])
    assert.equal(Object.keys(catalog).length, 48)
    assert.equal(catalog.custom_ai_tokens_cloud_business_quarterly.intervalCount, 3)
    assert.equal(catalog.pro_cloud_business_quarterly.intervalCount, 3)
    assert.equal(catalog.pro_selfhosted_personal_quarterly.intervalCount, 3)
    assert.equal(catalog.max_selfhosted_personal_yearly.interval, "year")
})

test("rejects missing and duplicate required subscription prices", () => {
    const prices = createPrices()
    assert.throws(() => normalizeSubscriptionPrices(prices.slice(1)), /pro_cloud_business_monthly/)
    assert.throws(() => normalizeSubscriptionPrices([...prices, prices[0]]), /more than once/)
})

test("rejects a lookup key assigned to the wrong recurring interval", () => {
    const prices = createPrices()
    prices[0] = { ...prices[0], interval: "year" }

    assert.throws(() => normalizeSubscriptionPrices(prices), /unexpected recurring interval/)
})

test("multiplies Stripe decimal minor units without floating-point price factors", () => {
    const price = normalizeSubscriptionPrices(createPrices()).custom_ai_tokens_cloud_business_monthly

    assert.equal(getSubscriptionPriceAmount(price, 1_000), 1)
    assert.equal(getSubscriptionPriceAmount(price, 500_000_000), 500_000)
})
