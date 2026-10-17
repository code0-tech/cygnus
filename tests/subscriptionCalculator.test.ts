import assert from "node:assert/strict"
import test from "node:test"
import {
    calculateExclusiveTaxRate,
    calculatePromotionDiscountAmount,
    calculateSubscriptionQuote,
    formatDiscountBadge,
    getMonthlyEquivalentAmount,
    getPaymentPeriodMonths,
    getPaymentPeriodSuffix,
    getSubscriptionDisplayPrices,
    resolveCheckoutPricing,
} from "@/lib/subscriptionCalculator"
import { SUBSCRIPTION_PRICE_LOOKUP_KEYS, type SubscriptionPriceCatalog, type SubscriptionPriceLookupKey } from "@/lib/subscriptionPrices"

const stripeAmounts: Partial<Record<SubscriptionPriceLookupKey, string>> = {
    pro_b2b_monthly: "1500",
    pro_b2b_quarterly: "4050",
    pro_b2b_yearly: "15000",
    pro_b2c_monthly: "1500",
    pro_b2c_quarterly: "4050",
    pro_b2c_yearly: "15000",
    max_b2b_monthly: "3000",
    max_b2b_quarterly: "8100",
    max_b2b_yearly: "30000",
    max_b2c_monthly: "3000",
    max_b2c_quarterly: "8100",
    max_b2c_yearly: "30000",
}

function createSubscriptionPrices(overrides: Partial<Record<SubscriptionPriceLookupKey, string>> = {}): SubscriptionPriceCatalog {
    return Object.fromEntries(
        SUBSCRIPTION_PRICE_LOOKUP_KEYS.map((lookupKey) => {
            const unitAmountDecimal = overrides[lookupKey] ?? stripeAmounts[lookupKey] ?? (lookupKey.startsWith("ai_token") ? "0.001" : "1")
            const period = lookupKey.split("_").at(-1)
            return [
                lookupKey,
                {
                    currency: "eur",
                    id: `price_${lookupKey}`,
                    interval: period === "yearly" ? "year" : "month",
                    intervalCount: period === "quarterly" ? 3 : 1,
                    lookupKey,
                    productName: lookupKey,
                    unitAmountDecimal,
                },
            ]
        })
    ) as SubscriptionPriceCatalog
}

const subscriptionPrices = createSubscriptionPrices()

const paymentPeriod = {
    description: "Choose how often to pay.",
    label: "Payment period",
    title: "Payment period",
    monthlyColor: "brand",
    monthlyDiscount: 0.05,
    monthlyPeriodSuffix: "per month",
    monthlyText: "Monthly",
    quarterlyColor: "aqua",
    quarterlyDiscount: 0.1,
    quarterlyPaidLabel: "paid quarterly",
    quarterlyPeriodSuffix: "per quarter",
    quarterlyText: "Quarterly",
    yearlyColor: "magenta",
    yearlyDiscount: 0.2,
    yearlyPaidLabel: "paid yearly",
    yearlyPeriodSuffix: "per year",
    yearlyText: "Yearly",
} as const

test("resolves payment period discounts and suffixes", () => {
    assert.equal(getPaymentPeriodSuffix("monthly", paymentPeriod), "per month")
    assert.equal(getPaymentPeriodSuffix("quarterly", paymentPeriod), "per quarter")
    assert.equal(getPaymentPeriodSuffix("yearly", paymentPeriod), "per year")

    assert.equal(getPaymentPeriodMonths("monthly"), 1)
    assert.equal(getPaymentPeriodMonths("quarterly"), 3)
    assert.equal(getPaymentPeriodMonths("yearly"), 12)
})

test("normalizes subscription amounts to a comparable monthly amount", () => {
    assert.equal(getMonthlyEquivalentAmount(3_000, "monthly"), 3_000)
    assert.equal(getMonthlyEquivalentAmount(8_100, "quarterly"), 2_700)
    assert.equal(getMonthlyEquivalentAmount(28_800, "yearly"), 2_400)
})

test("keeps the exact period total when its monthly equivalent must be rounded", () => {
    assert.deepEqual(getSubscriptionDisplayPrices(25_000, "quarterly"), {
        monthlyPrice: 83.33,
        paymentPeriodPrice: 250,
    })
})

test("formats discount badges by locale", () => {
    assert.equal(formatDiscountBadge(0.2, "en"), "20%")
    assert.equal(formatDiscountBadge(0.2, "de"), "20\u00a0%")
})

test("calculates the exclusive tax rate from a Crater tax quote", () => {
    assert.equal(calculateExclusiveTaxRate(11_900, 1_900), 0.19)
    assert.equal(calculateExclusiveTaxRate(0, 0), 0)
})

test("calculates Crater promotion discounts", () => {
    assert.equal(calculatePromotionDiscountAmount(100, { amountOff: null, percentOff: 15 }), 15)
    assert.equal(calculatePromotionDiscountAmount(100, { amountOff: 2_500, percentOff: null }), 25)
    assert.equal(calculatePromotionDiscountAmount(10, { amountOff: 2_500, percentOff: null }), 10)
    assert.equal(calculatePromotionDiscountAmount(100, null), 0)
})

test("builds a cent-based custom subscription quote", () => {
    const quote = calculateSubscriptionQuote(
        {
            aiTokens: 1_000_000,
            customerType: "b2b",
            deployment: "self_hosted",
            paymentPeriod: "yearly",
            plan: "custom",
            workflowExecutions: 1_000,
        },
        {
            aiTokens: {} as never,
            defaults: {} as never,
            packages: {} as never,
            paymentPeriod,
            workflowExecutions: {} as never,
            subscriptionPrices,
        }
    )

    assert.equal(quote.subtotal, 24_000)
    assert.equal(quote.periodDiscount, 22_000)
    assert.equal(quote.total, 2_000)
})

test("uses Stripe component prices instead of CMS price factors", () => {
    const catalog = {
        aiTokens: {} as never,
        defaults: {} as never,
        packages: {} as never,
        paymentPeriod,
        workflowExecutions: {} as never,
        subscriptionPrices,
    }
    const selectionBase = {
        aiTokens: 1_000_000,
        deployment: "self_hosted",
        plan: "custom",
        workflowExecutions: 1_000,
    } as const

    const b2cMonthly = calculateSubscriptionQuote({ ...selectionBase, customerType: "b2c", paymentPeriod: "monthly" }, catalog)
    assert.equal(b2cMonthly.subtotal, 2_000)
    assert.equal(b2cMonthly.periodDiscount, 0)
    assert.equal(b2cMonthly.total, 2_000)

    const b2bMonthly = calculateSubscriptionQuote({ ...selectionBase, customerType: "b2b", paymentPeriod: "monthly" }, catalog)
    assert.equal(b2bMonthly.periodDiscount, 0)
    assert.equal(b2bMonthly.total, 2_000)
})

test("preserves the regular fixed-plan price for period discount summaries", () => {
    const config = {
        defaults: { customerType: "b2c", deployment: "self_hosted", paymentPeriod: { b2b: "monthly", b2c: "monthly" } },
        paymentPeriod,
        packages: {
            pro: {
                prices: { monthly: 10, quarterly: 27, yearly: 96 },
                title: "Pro",
            },
        },
    } as never

    const result = resolveCheckoutPricing({
        aiTokensParam: null,
        customerTypeParam: null,
        fallbackPeriodSuffix: "/year",
        paymentPeriodParam: "yearly",
        planParam: "pro",
        subscriptionConfig: config,
        subscriptionPrices,
        workflowExecutionsParam: null,
    })

    assert.equal(result.pricing.totalBeforeDiscount, 180)
    assert.equal(result.pricing.totalPrice, 150)
})

test("prices a fixed plan from the b2b prices for a b2b customer", () => {
    const config = {
        aiTokenPriceFactor: 0.001,
        aiTokens: {
            b2b: { default: 100, min: 100, max: 1_000, step: 100 },
            b2c: { default: 10, min: 10, max: 100, step: 10 },
        },
        defaults: {
            customerType: "b2c",
            paymentPeriod: { b2b: "monthly", b2c: "monthly" },
        },
        packages: {
            custom: { title: "Custom" },
            pro: { prices: { monthly: 10, quarterly: 27, yearly: 96 }, title: "Pro" },
        },
        paymentPeriod,
        workflowExecutionPriceFactor: 0.01,
        workflowExecutions: {
            b2b: { default: 20, min: 20, max: 200, step: 10 },
            b2c: { default: 10, min: 10, max: 100, step: 10 },
        },
    } as never

    const quarterly = resolveCheckoutPricing({
        aiTokensParam: null,
        customerTypeParam: "b2b",
        fallbackPeriodSuffix: "/mo",
        paymentPeriodParam: "quarterly",
        planParam: "pro",
        subscriptionConfig: config,
        subscriptionPrices,
        workflowExecutionsParam: null,
    })

    assert.equal(quarterly.plan, "pro")
    assert.equal(quarterly.isCustomPlan, false)
    assert.equal(quarterly.paymentPeriod, "quarterly")
    assert.equal(quarterly.pricing.totalPrice, 40.5)
    assert.equal(quarterly.pricing.totalBeforeDiscount, 45)
    assert.equal(quarterly.aiTokens, 0)
    assert.equal(quarterly.workflowExecutions, 0)
})

test("supports the same payment periods for both customer types in the checkout price display", () => {
    const config = {
        aiTokenPriceFactor: 0.001,
        aiTokens: {
            b2b: { default: 100, min: 100, max: 1_000, step: 100 },
            b2c: { default: 10, min: 10, max: 100, step: 10 },
        },
        defaults: {
            customerType: "b2c",
            paymentPeriod: { b2b: "monthly", b2c: "monthly" },
        },
        packages: {
            custom: { title: "Custom" },
        },
        paymentPeriod,
        workflowExecutionPriceFactor: 0.01,
        workflowExecutions: {
            b2b: { default: 20, min: 20, max: 200, step: 10 },
            b2c: { default: 10, min: 10, max: 100, step: 10 },
        },
    } as never

    const invalidWeekly = resolveCheckoutPricing({
        aiTokensParam: null,
        customerTypeParam: "b2b",
        fallbackPeriodSuffix: "/mo",
        paymentPeriodParam: "weekly",
        planParam: "custom",
        subscriptionConfig: config,
        subscriptionPrices,
        workflowExecutionsParam: null,
    })
    const b2cQuarterly = resolveCheckoutPricing({
        aiTokensParam: null,
        customerTypeParam: "b2c",
        fallbackPeriodSuffix: "/mo",
        paymentPeriodParam: "quarterly",
        planParam: "custom",
        subscriptionConfig: config,
        subscriptionPrices,
        workflowExecutionsParam: null,
    })
    assert.equal(invalidWeekly.paymentPeriod, "monthly")
    assert.equal(b2cQuarterly.paymentPeriod, "quarterly")
})

test("clamps manipulated custom-plan usage parameters before calculating the price", () => {
    const config = {
        aiTokenPriceFactor: 0.001,
        aiTokens: {
            b2b: { default: 100, min: 100, max: 1_000, step: 100 },
            b2c: { default: 10, min: 10, max: 100, step: 10 },
        },
        defaults: {
            customerType: "b2b",
            paymentPeriod: { b2b: "monthly", b2c: "monthly" },
        },
        packages: {
            custom: {
                title: "Custom",
            },
        },
        paymentPeriod,
        workflowExecutionPriceFactor: 0.01,
        workflowExecutions: {
            b2b: { default: 20, min: 20, max: 200, step: 10 },
            b2c: { default: 10, min: 10, max: 100, step: 10 },
        },
    } as never

    const result = resolveCheckoutPricing({
        aiTokensParam: "1",
        customerTypeParam: "b2b",
        fallbackPeriodSuffix: "/mo",
        paymentPeriodParam: "monthly",
        planParam: "custom",
        subscriptionConfig: config,
        subscriptionPrices,
        workflowExecutionsParam: "999999",
    })

    assert.equal(result.aiTokens, 100)
    assert.equal(result.workflowExecutions, 200)
    assert.equal(result.pricing.aiTokenPrice, 0)
    assert.equal(result.pricing.workflowExecutionPrice, 2)
    assert.equal(result.pricing.totalPrice, 2)
})
