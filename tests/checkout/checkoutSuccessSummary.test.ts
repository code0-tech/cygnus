import assert from "node:assert/strict"
import test from "node:test"
import { buildCheckoutSuccessSummary } from "@/lib/checkout/checkoutSuccessSummary"
import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"

const checkoutContent = {
    summary: {
        aiTokensIcon: "tabler:IconBrain",
        aiTokensIconColor: "magenta",
        aiTokensLabel: "AI Tokens",
        configurationLabel: "Your configuration",
        customerTypeIcons: { b2b: "tabler:IconBriefcase2", b2c: "tabler:IconBuildingStore" },
        customerTypeIconColor: "yellow",
        customerTypeLabel: "Customer Type",
        deploymentIcons: { cloud: "tabler:IconCloud", selfHosted: "tabler:IconServer" },
        deploymentIconColor: "aqua",
        deploymentLabel: "Deployment",
        workflowExecutionsIcon: "tabler:IconBolt",
        workflowExecutionsIconColor: "brand",
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
    plan: {
        custom: { icon: "tabler:IconSettings" },
        max: { icon: "tabler:IconRocket" },
        pro: { icon: "tabler:IconSparkles" },
    },
    paymentPeriod: {
        title: "Payment period",
        monthlyColor: "brand",
        monthlyText: "Monthly",
        quarterlyColor: "aqua",
        quarterlyText: "Quarterly",
        weeklyColor: "lime",
        weeklyText: "Weekly",
        yearlyColor: "magenta",
        yearlyText: "Yearly",
    },
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
        { id: "plan", label: "Plan", value: "Pro", icon: "tabler:IconSparkles", tone: "brand" },
        { id: "customerType", label: "Customer Type", value: "B2B", icon: "tabler:IconBriefcase2", tone: "yellow" },
        { id: "deployment", label: "Deployment", value: "Self Hosted", icon: "tabler:IconServer", tone: "aqua" },
        { id: "paymentPeriod", label: "Payment period", value: "Quarterly", icon: "tabler:IconCalendarMonth", tone: "aqua" },
    ])
})

test("summarizes the custom plan with its quantities, deployment, and customer type", () => {
    const summary = buildCheckoutSuccessSummary({
        checkoutContent,
        searchParams: new URLSearchParams({ plan: "custom", customerType: "b2c", deploymentType: "cloud", paymentPeriod: "yearly", aiTokens: "50000", workflowExecutions: "1000" }),
        subscriptionConfig,
    })

    assert.deepEqual(summary?.rows, [
        { id: "plan", label: "Plan", value: "Custom", icon: "tabler:IconSettings", tone: "aqua" },
        { id: "customerType", label: "Customer Type", value: "B2C", icon: "tabler:IconBuildingStore", tone: "yellow" },
        { id: "deployment", label: "Deployment", value: "Cloud", icon: "tabler:IconCloud", tone: "aqua" },
        { id: "paymentPeriod", label: "Payment period", value: "Yearly", icon: "tabler:IconCalendarMonth", tone: "magenta" },
        { id: "aiTokens", label: "AI Tokens", value: "50K", icon: "tabler:IconBrain", tone: "magenta" },
        { id: "workflowExecutions", label: "Workflow Executions", value: "1K", icon: "tabler:IconBolt", tone: "brand" },
    ])
})

test("normalizes a manipulated period against the customer type", () => {
    const summary = buildCheckoutSuccessSummary({
        checkoutContent,
        searchParams: new URLSearchParams({ plan: "max", customerType: "b2b", paymentPeriod: "weekly" }),
        subscriptionConfig,
    })

    assert.equal(summary?.rows.find((row) => row.id === "paymentPeriod")?.value, "Monthly")
})

test("falls back to a default plan icon when the CMS field is blank", () => {
    const blankPlanIconConfig = { ...subscriptionConfig, plan: { ...subscriptionConfig.plan, max: { icon: "  " } } } as SubscriptionConfigData
    const summary = buildCheckoutSuccessSummary({
        checkoutContent,
        searchParams: new URLSearchParams({ plan: "max", customerType: "b2c", paymentPeriod: "monthly" }),
        subscriptionConfig: blankPlanIconConfig,
    })

    assert.equal(summary?.rows[0]?.icon, "tabler:IconRocket")
})

test("stays absent without a plan or without the CMS content", () => {
    assert.equal(buildCheckoutSuccessSummary({ checkoutContent, searchParams: new URLSearchParams({ session_id: "cs_test" }), subscriptionConfig }), null)
    assert.equal(buildCheckoutSuccessSummary({ checkoutContent: null, searchParams: new URLSearchParams({ plan: "pro" }), subscriptionConfig }), null)
    assert.equal(buildCheckoutSuccessSummary({ checkoutContent, searchParams: new URLSearchParams({ plan: "pro" }), subscriptionConfig: null }), null)
})
