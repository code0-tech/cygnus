import assert from "node:assert/strict"
import test from "node:test"
import { getSubscriptionPriceAmount, normalizeSubscriptionPrices, SUBSCRIPTION_PRICE_LOOKUP_KEYS } from "@/lib/subscriptionPrices"
import type { CheckoutPrice } from "@code0-tech/crater-graphql-types"

function createPrices(): CheckoutPrice[] {
    return SUBSCRIPTION_PRICE_LOOKUP_KEYS.map((lookupKey) => ({
        currency: "eur",
        id: `price_${lookupKey}`,
        interval: lookupKey.endsWith("yearly") ? "year" : "month",
        intervalCount: lookupKey.endsWith("quarterly") ? 3 : 1,
        lookupKey,
        productName: lookupKey,
        unitAmount: lookupKey.startsWith("ai_token") ? null : 1,
        unitAmountDecimal: lookupKey.startsWith("ai_token") ? "0.001" : "1",
    }))
}

test("normalizes the complete Crater subscription price list by lookup key", () => {
    const catalog = normalizeSubscriptionPrices([
        ...createPrices(),
        { id: "price_unrelated", lookupKey: null, productName: "Unrelated" },
    ])

    assert.deepEqual(Object.keys(catalog), [...SUBSCRIPTION_PRICE_LOOKUP_KEYS])
    assert.equal(catalog.ai_token_b2b_quarterly.intervalCount, 3)
    assert.equal(catalog.pro_b2b_quarterly.intervalCount, 3)
    assert.equal(catalog.pro_b2c_quarterly.intervalCount, 3)
    assert.equal(catalog.max_b2c_yearly.interval, "year")
})

test("rejects missing and duplicate required subscription prices", () => {
    const prices = createPrices()
    assert.throws(() => normalizeSubscriptionPrices(prices.slice(1)), /pro_b2b_monthly/)
    assert.throws(() => normalizeSubscriptionPrices([...prices, prices[0]]), /more than once/)
})

test("rejects a lookup key assigned to the wrong recurring interval", () => {
    const prices = createPrices()
    prices[0] = { ...prices[0], interval: "year" }

    assert.throws(() => normalizeSubscriptionPrices(prices), /unexpected recurring interval/)
})

test("multiplies Stripe decimal minor units without floating-point price factors", () => {
    const price = normalizeSubscriptionPrices(createPrices()).ai_token_b2b_monthly

    assert.equal(getSubscriptionPriceAmount(price, 1_000), 1)
    assert.equal(getSubscriptionPriceAmount(price, 500_000_000), 500_000)
})
