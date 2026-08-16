import assert from "node:assert/strict"
import test from "node:test"
import { buildCheckoutSuccessSummary } from "@/lib/checkout/checkoutSuccessSummary"
import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"

const checkoutContent = {
    summary: {
        aiTokensLabel: "AI Tokens",
        configurationLabel: "Your configuration",
        workflowExecutionsLabel: "Workflow Executions",
        pricing: { planLabel: "Plan" },
    },
} as CheckoutData

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
    paymentPeriod: { label: "Payment period", monthlyText: "Monthly", quarterlyText: "Quarterly", weeklyText: "Weekly", yearlyText: "Yearly" },
    workflowExecutions: {
        b2b: { default: 1_000, min: 200, max: 10_000, step: 100 },
        b2c: { default: 100, min: 10, max: 1_000, step: 10 },
    },
} as SubscriptionConfigData

test("summarizes a fixed plan without the custom quantities", () => {
    const summary = buildCheckoutSuccessSummary({
        checkoutContent,
        searchParams: new URLSearchParams({ plan: "pro", customerType: "b2b", paymentPeriod: "quarterly" }),
        subscriptionConfig,
    })

    assert.equal(summary?.title, "Your configuration")
    assert.deepEqual(summary?.rows, [
        { id: "plan", label: "Plan", value: "Pro" },
        { id: "paymentPeriod", label: "Payment period", value: "Quarterly" },
    ])
})

test("summarizes the custom plan with its quantities", () => {
    const summary = buildCheckoutSuccessSummary({
        checkoutContent,
        searchParams: new URLSearchParams({ plan: "custom", customerType: "b2b", paymentPeriod: "yearly", aiTokens: "1000000", workflowExecutions: "1000" }),
        subscriptionConfig,
    })

    assert.deepEqual(summary?.rows, [
        { id: "plan", label: "Plan", value: "Custom" },
        { id: "paymentPeriod", label: "Payment period", value: "Yearly" },
        { id: "aiTokens", label: "AI Tokens", value: "1M" },
        { id: "workflowExecutions", label: "Workflow Executions", value: "1K" },
    ])
})

test("normalizes a manipulated period against the customer type", () => {
    const summary = buildCheckoutSuccessSummary({
        checkoutContent,
        searchParams: new URLSearchParams({ plan: "max", customerType: "b2b", paymentPeriod: "weekly" }),
        subscriptionConfig,
    })

    assert.equal(summary?.rows[1]?.value, "Monthly")
})

test("stays absent without a plan or without the CMS content", () => {
    assert.equal(buildCheckoutSuccessSummary({ checkoutContent, searchParams: new URLSearchParams({ session_id: "cs_test" }), subscriptionConfig }), null)
    assert.equal(buildCheckoutSuccessSummary({ checkoutContent: null, searchParams: new URLSearchParams({ plan: "pro" }), subscriptionConfig }), null)
    assert.equal(buildCheckoutSuccessSummary({ checkoutContent, searchParams: new URLSearchParams({ plan: "pro" }), subscriptionConfig: null }), null)
})
