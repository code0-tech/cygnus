import assert from "node:assert/strict"
import test from "node:test"
import {
    calculateExclusiveTaxRate,
    calculatePromotionDiscountAmount,
    calculateSubscriptionQuote,
    formatDiscountBadge,
    getMonthlyEquivalentAmount,
    getPaymentPeriodDiscount,
    getPaymentPeriodMonths,
    getPaymentPeriodSuffix,
    resolveCheckoutPricing,
} from "@/lib/subscriptionCalculator"

const paymentPeriod = {
    description: "Choose how often to pay.",
    label: "Payment period",
    weeklyColor: "lime",
    weeklyPaidLabel: "paid weekly",
    weeklyPeriodSuffix: "per week",
    weeklyText: "Weekly",
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
    assert.equal(getPaymentPeriodDiscount("weekly", paymentPeriod, "b2c"), 0)
    assert.equal(getPaymentPeriodDiscount("monthly", paymentPeriod, "b2b"), 0)
    assert.equal(getPaymentPeriodDiscount("monthly", paymentPeriod, "b2c"), 0.05)
    assert.equal(getPaymentPeriodDiscount("quarterly", paymentPeriod, "b2b"), 0.1)
    assert.equal(getPaymentPeriodDiscount("yearly", paymentPeriod, "b2c"), 0.2)

    assert.equal(getPaymentPeriodSuffix("weekly", paymentPeriod), "per week")
    assert.equal(getPaymentPeriodSuffix("monthly", paymentPeriod), "per month")
    assert.equal(getPaymentPeriodSuffix("quarterly", paymentPeriod), "per quarter")
    assert.equal(getPaymentPeriodSuffix("yearly", paymentPeriod), "per year")

    assert.equal(getPaymentPeriodMonths("weekly"), 1 / 4.345)
    assert.equal(getPaymentPeriodMonths("monthly"), 1)
    assert.equal(getPaymentPeriodMonths("quarterly"), 3)
    assert.equal(getPaymentPeriodMonths("yearly"), 12)
})

test("normalizes subscription amounts to a comparable monthly amount", () => {
    assert.equal(getMonthlyEquivalentAmount(1_000, "weekly"), 4_345)
    assert.equal(getMonthlyEquivalentAmount(3_000, "monthly"), 3_000)
    assert.equal(getMonthlyEquivalentAmount(8_100, "quarterly"), 2_700)
    assert.equal(getMonthlyEquivalentAmount(28_800, "yearly"), 2_400)
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
            additionalFeatureIds: ["support"],
            aiTokens: 1_000_000,
            customerType: "b2b",
            deployment: "self_hosted",
            paymentPeriod: "yearly",
            plan: "custom",
            workflowExecutions: 1_000,
        },
        {
            additionalFeatures: [{ id: "support", title: "Support", description: "", icon: "", price: 25, weeklyPrice: 5 }],
            aiTokenPriceFactor: 0.00001,
            aiTokenWeeklyPriceFactor: 0.000002,
            aiTokens: {} as never,
            defaults: {} as never,
            packages: {} as never,
            paymentPeriod,
            workflowExecutionPriceFactor: 0.01,
            workflowExecutionWeeklyPriceFactor: 0.002,
            workflowExecutions: {} as never,
        }
    )

    assert.equal(quote.subtotal, 54_000)
    assert.equal(quote.periodDiscount, 10_800)
    assert.equal(quote.total, 43_200)
})

test("uses the explicit weekly price factors directly and applies the b2c monthly discount against them", () => {
    const catalog = {
        additionalFeatures: [{ id: "support", title: "Support", description: "", icon: "", price: 25, weeklyPrice: 5 }],
        aiTokenPriceFactor: 0.00001,
        aiTokenWeeklyPriceFactor: 0.000002,
        aiTokens: {} as never,
        defaults: {} as never,
        packages: {} as never,
        paymentPeriod,
        workflowExecutionPriceFactor: 0.01,
        workflowExecutionWeeklyPriceFactor: 0.002,
        workflowExecutions: {} as never,
    }
    const selectionBase = {
        additionalFeatureIds: ["support"] as string[],
        aiTokens: 1_000_000,
        deployment: "self_hosted",
        plan: "custom",
        workflowExecutions: 1_000,
    } as const

    const b2cMonthly = calculateSubscriptionQuote({ ...selectionBase, customerType: "b2c", paymentPeriod: "monthly" }, catalog)
    assert.equal(b2cMonthly.subtotal, 4_500)
    assert.equal(b2cMonthly.periodDiscount, 225)
    assert.equal(b2cMonthly.total, 4_275)

    const b2bMonthly = calculateSubscriptionQuote({ ...selectionBase, customerType: "b2b", paymentPeriod: "monthly" }, catalog)
    assert.equal(b2bMonthly.periodDiscount, 0)
    assert.equal(b2bMonthly.total, 4_500)

    const b2cWeekly = calculateSubscriptionQuote({ ...selectionBase, customerType: "b2c", paymentPeriod: "weekly" }, catalog)
    assert.equal(b2cWeekly.subtotal, 900)
    assert.equal(b2cWeekly.periodDiscount, 0)
    assert.equal(b2cWeekly.total, 900)
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
        additionalFeatureIds: [],
        aiTokensParam: null,
        customerTypeParam: null,
        fallbackPeriodSuffix: "/year",
        paymentPeriodParam: "yearly",
        planParam: "pro",
        subscriptionConfig: config,
        workflowExecutionsParam: null,
    })

    assert.equal(result.pricing.totalBeforeDiscount, 120)
    assert.equal(result.pricing.totalPrice, 96)
})

test("forces the custom plan when a b2b customer requests a pro or max checkout via the URL", () => {
    const config = {
        additionalFeatures: [],
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

    const result = resolveCheckoutPricing({
        additionalFeatureIds: [],
        aiTokensParam: null,
        customerTypeParam: "b2b",
        fallbackPeriodSuffix: "/mo",
        paymentPeriodParam: "monthly",
        planParam: "pro",
        subscriptionConfig: config,
        workflowExecutionsParam: null,
    })

    assert.equal(result.plan, "custom")
    assert.equal(result.isCustomPlan, true)
    assert.equal(result.workflowExecutions, 20)
    assert.equal(result.aiTokens, 100)
})

test("downgrades weekly to monthly for b2b and quarterly to monthly for b2c in the checkout price display", () => {
    const config = {
        additionalFeatures: [],
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

    const b2bWeekly = resolveCheckoutPricing({
        additionalFeatureIds: [],
        aiTokensParam: null,
        customerTypeParam: "b2b",
        fallbackPeriodSuffix: "/mo",
        paymentPeriodParam: "weekly",
        planParam: "custom",
        subscriptionConfig: config,
        workflowExecutionsParam: null,
    })
    const b2cQuarterly = resolveCheckoutPricing({
        additionalFeatureIds: [],
        aiTokensParam: null,
        customerTypeParam: "b2c",
        fallbackPeriodSuffix: "/mo",
        paymentPeriodParam: "quarterly",
        planParam: "custom",
        subscriptionConfig: config,
        workflowExecutionsParam: null,
    })

    assert.equal(b2bWeekly.paymentPeriod, "monthly")
    assert.equal(b2cQuarterly.paymentPeriod, "monthly")
})

test("clamps manipulated custom-plan usage parameters before calculating the price", () => {
    const config = {
        additionalFeatures: [],
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
        additionalFeatureIds: [],
        aiTokensParam: "1",
        customerTypeParam: "b2b",
        fallbackPeriodSuffix: "/mo",
        paymentPeriodParam: "monthly",
        planParam: "custom",
        subscriptionConfig: config,
        workflowExecutionsParam: "999999",
    })

    assert.equal(result.aiTokens, 100)
    assert.equal(result.workflowExecutions, 200)
    assert.equal(result.pricing.aiTokenPrice, 0.1)
    assert.equal(result.pricing.workflowExecutionPrice, 2)
    assert.equal(result.pricing.totalPrice, 2.1)
})
