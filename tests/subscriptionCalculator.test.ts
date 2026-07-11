import assert from "node:assert/strict"
import test from "node:test"
import { calculateSubscriptionPrice, clampToRange, formatDiscountBadge, getPaymentPeriodDiscount, getPaymentPeriodSuffix } from "@/lib/subscriptionCalculator"

const paymentPeriod = {
    description: "Choose how often to pay.",
    label: "Payment period",
    monthlyPeriodSuffix: "per month",
    monthlyText: "Monthly",
    quarterlyDiscount: 0.1,
    quarterlyPeriodSuffix: "per quarter",
    quarterlyText: "Quarterly",
    yearlyDiscount: 0.2,
    yearlyPeriodSuffix: "per year",
    yearlyText: "Yearly",
}

test("clamps usage values to configured range", () => {
    const range = { min: 100, max: 1_000, step: 100 }

    assert.equal(clampToRange(50, range), 100)
    assert.equal(clampToRange(500, range), 500)
    assert.equal(clampToRange(2_000, range), 1_000)
})

test("resolves payment period discounts and suffixes", () => {
    assert.equal(getPaymentPeriodDiscount("monthly", paymentPeriod), 0)
    assert.equal(getPaymentPeriodDiscount("quarterly", paymentPeriod), 0.1)
    assert.equal(getPaymentPeriodDiscount("yearly", paymentPeriod), 0.2)

    assert.equal(getPaymentPeriodSuffix("monthly", paymentPeriod), "per month")
    assert.equal(getPaymentPeriodSuffix("quarterly", paymentPeriod), "per quarter")
    assert.equal(getPaymentPeriodSuffix("yearly", paymentPeriod), "per year")
})

test("formats discount badges by locale", () => {
    assert.equal(formatDiscountBadge(0.2, "en"), "20%")
    assert.equal(formatDiscountBadge(0.2, "de"), "20\u00a0%")
})

test("calculates subscription totals before and after discount", () => {
    assert.deepEqual(
        calculateSubscriptionPrice({
            additionalFeaturesPrice: 25,
            aiTokenPriceFactor: 0.00001,
            aiTokens: 1_000_000,
            discount: 0.2,
            workflowExecutionPriceFactor: 0.01,
            workflowExecutions: 1_000,
        }),
        {
            aiTokenPrice: 10,
            totalBeforeDiscount: 45,
            totalPrice: 36,
            workflowExecutionPrice: 10,
        }
    )
})
