import assert from "node:assert/strict"
import test from "node:test"
import {
    calculateExclusiveTaxRate,
    calculatePromotionDiscountAmount,
    calculateSubscriptionQuote,
    formatDiscountBadge,
    getPaymentPeriodDiscount,
    getPaymentPeriodMonths,
    getPaymentPeriodSuffix,
    resolveCheckoutPricing,
} from "@/lib/subscriptionCalculator"

const paymentPeriod = {
    description: "Choose how often to pay.",
    label: "Payment period",
    weeklyColor: "lime",
    weeklyPeriodSuffix: "per week",
    weeklyText: "Weekly",
    monthlyColor: "brand",
    monthlyPeriodSuffix: "per month",
    monthlyText: "Monthly",
    quarterlyColor: "aqua",
    quarterlyDiscount: 0.1,
    quarterlyPeriodSuffix: "per quarter",
    quarterlyText: "Quarterly",
    yearlyColor: "magenta",
    yearlyDiscount: 0.2,
    yearlyPeriodSuffix: "per year",
    yearlyText: "Yearly",
} as const

test("resolves payment period discounts and suffixes", () => {
    assert.equal(getPaymentPeriodDiscount("weekly", paymentPeriod), 0)
    assert.equal(getPaymentPeriodDiscount("monthly", paymentPeriod), 0)
    assert.equal(getPaymentPeriodDiscount("quarterly", paymentPeriod), 0.1)
    assert.equal(getPaymentPeriodDiscount("yearly", paymentPeriod), 0.2)

    assert.equal(getPaymentPeriodSuffix("weekly", paymentPeriod), "per week")
    assert.equal(getPaymentPeriodSuffix("monthly", paymentPeriod), "per month")
    assert.equal(getPaymentPeriodSuffix("quarterly", paymentPeriod), "per quarter")
    assert.equal(getPaymentPeriodSuffix("yearly", paymentPeriod), "per year")

    assert.equal(getPaymentPeriodMonths("weekly"), 1 / 4.345)
    assert.equal(getPaymentPeriodMonths("monthly"), 1)
    assert.equal(getPaymentPeriodMonths("quarterly"), 3)
    assert.equal(getPaymentPeriodMonths("yearly"), 12)
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
            additionalFeatures: [{ id: "support", title: "Support", description: "", icon: "", price: 25 }],
            aiTokenPriceFactor: 0.00001,
            aiTokens: {} as never,
            defaults: {} as never,
            packages: {} as never,
            paymentPeriod,
            workflowExecutionPriceFactor: 0.01,
            workflowExecutions: {} as never,
        }
    )

    assert.equal(quote.subtotal, 54_000)
    assert.equal(quote.periodDiscount, 10_800)
    assert.equal(quote.total, 43_200)
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
