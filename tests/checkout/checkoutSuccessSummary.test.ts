import assert from "node:assert/strict"
import test from "node:test"
import { buildCheckoutSuccessSummary } from "@/lib/checkout/checkoutSuccessSummary"
import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"
import { SUBSCRIPTION_PRICE_LOOKUP_KEYS, type SubscriptionPriceCatalog } from "@/lib/subscriptionPrices"

const subscriptionPrices = Object.fromEntries(
    SUBSCRIPTION_PRICE_LOOKUP_KEYS.map((lookupKey) => {
        const period = lookupKey.split("_").at(-1)
        const unitAmountDecimal = lookupKey === "pro_b2b_monthly" ? "1500" : lookupKey === "pro_b2b_quarterly" ? "4050" : lookupKey.startsWith("ai_token") ? "0.001" : "1"
        return [
            lookupKey,
            {
                currency: "eur",
                id: `price_${lookupKey}`,
                interval: period === "weekly" ? "week" : period === "yearly" ? "year" : "month",
                intervalCount: period === "quarterly" ? 3 : 1,
                lookupKey,
                productName: lookupKey,
                unitAmountDecimal,
            },
        ]
    })
) as SubscriptionPriceCatalog

const checkoutContent = {
    summary: {
        eyebrow: "Order summary",
        heading: "Review your configuration",
        description: "Your selected configuration",
        customerTypeIcons: { b2b: "tabler:IconBriefcase2", b2c: "tabler:IconBuildingStore" },
        customerTypeIconColor: "yellow",
        deploymentIcons: { cloud: "tabler:IconCloud", selfHosted: "tabler:IconServer" },
        deploymentIconColor: "aqua",
        pricing: {
            planLabel: "Plan",
            baseLabel: "AI Tokens",
            workflowExecutionsLabel: "Workflow executions",
            quarterlyDiscountLabel: "Quarterly discount",
            yearlyDiscountLabel: "Yearly discount",
            discountInputPlaceholder: "Code",
            discountButtonLabel: "Apply",
            discountPromptLabel: "Discount?",
            discountRemoveLabel: "Remove",
            taxLabel: "Tax",
            totalLabel: "Total",
            perMonthSuffix: "per month",
        },
    },
} as unknown as CheckoutData

const subscriptionConfig = {
    aiTokens: {
        b2b: { default: 200_000, min: 100_000, max: 1_000_000, step: 100_000 },
        b2c: { default: 20_000, min: 10_000, max: 100_000, step: 10_000 },
    },
    defaults: { customerType: "b2c", deployment: "self_hosted", paymentPeriod: { b2b: "monthly", b2c: "monthly" } },
    packages: {
        custom: { title: "Custom" },
        max: { title: "Max" },
        pro: { title: "Pro" },
    },
    plan: {
        custom: { icon: "tabler:IconSettings" },
        max: { icon: "tabler:IconRocket" },
        pro: { icon: "tabler:IconSparkles" },
    },
    paymentPeriod: {
        monthlyColor: "brand",
        monthlyPeriodSuffix: "per month",
        monthlyText: "Monthly",
        quarterlyColor: "aqua",
        quarterlyPeriodSuffix: "per quarter",
        quarterlyText: "Quarterly",
        weeklyColor: "lime",
        weeklyPeriodSuffix: "per week",
        weeklyText: "Weekly",
        yearlyColor: "magenta",
        yearlyPeriodSuffix: "per year",
        yearlyText: "Yearly",
    },
    workflowExecutions: {
        b2b: { default: 1_000, min: 200, max: 10_000, step: 100 },
        b2c: { default: 100, min: 10, max: 1_000, step: 10 },
    },
} as unknown as SubscriptionConfigData

test("resolves the success deployment without loading prices", () => {
    const summary = buildCheckoutSuccessSummary({
        checkoutContent,
        searchParams: new URLSearchParams({ plan: "pro", customerType: "b2b", paymentPeriod: "quarterly" }),
        subscriptionConfig,
    })

    assert.equal(summary?.deployment, "self_hosted")
    assert.equal(summary?.overview, undefined)
})

test("builds the checkout pricing overview from Crater's recurring price catalog", () => {
    const summary = buildCheckoutSuccessSummary({
        checkoutContent,
        searchParams: new URLSearchParams({ plan: "pro", customerType: "b2b", paymentPeriod: "quarterly" }),
        subscriptionConfig,
        subscriptionPrices,
    })

    assert.equal(summary?.overview?.planPrice, 40.5)
    assert.equal(summary?.overview?.paymentPeriodDiscountAmount, 4.5)
    assert.equal(summary?.overview?.totalPrice, 40.5)
    assert.equal(summary?.overview?.periodSuffix, "per quarter")
})

test("keeps the selected deployment in the pricing overview", () => {
    const summary = buildCheckoutSuccessSummary({
        checkoutContent,
        searchParams: new URLSearchParams({ plan: "custom", customerType: "b2c", deploymentType: "cloud", paymentPeriod: "yearly", aiTokens: "50000", workflowExecutions: "1000" }),
        subscriptionConfig,
        subscriptionPrices,
    })

    assert.equal(summary?.deployment, "cloud")
    assert.equal(summary?.overview?.deployment, "cloud")
    assert.equal(summary?.overview?.aiTokens, 50_000)
})

test("normalizes a manipulated period against the customer type", () => {
    const summary = buildCheckoutSuccessSummary({
        checkoutContent,
        searchParams: new URLSearchParams({ plan: "max", customerType: "b2b", paymentPeriod: "weekly" }),
        subscriptionConfig,
        subscriptionPrices,
    })

    assert.equal(summary?.overview?.periodSuffix, "per month")
})

test("stays absent without a plan or without the CMS content", () => {
    assert.equal(buildCheckoutSuccessSummary({ checkoutContent, searchParams: new URLSearchParams({ session_id: "cs_test" }), subscriptionConfig }), null)
    assert.equal(buildCheckoutSuccessSummary({ checkoutContent: null, searchParams: new URLSearchParams({ plan: "pro" }), subscriptionConfig }), null)
    assert.equal(buildCheckoutSuccessSummary({ checkoutContent, searchParams: new URLSearchParams({ plan: "pro" }), subscriptionConfig: null }), null)
})
