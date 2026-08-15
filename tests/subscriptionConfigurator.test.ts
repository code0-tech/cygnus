import assert from "node:assert/strict"
import test from "node:test"
import type { SubscriptionConfiguratorContent } from "../src/lib/cms"
import {
    buildSubscriptionSelectionSearchParams,
    getPaymentPeriodForPlan,
    getPlanForCustomerType,
    parseSubscriptionSelectionFromSearchParams,
    reduceSubscriptionSelection,
    resolveSubscriptionSelection,
    type SubscriptionSelection,
} from "../src/lib/subscriptionConfigurator"

const content = {
    defaults: {
        deployment: "self_hosted",
        customerType: "b2c",
        paymentPeriod: { b2b: "monthly", b2c: "monthly" },
    },
    workflowExecutions: {
        b2b: { default: 200, min: 200, max: 10_000, step: 100 },
        b2c: { default: 10, min: 10, max: 1_000, step: 10 },
    },
    aiTokens: {
        b2b: { default: 100_000, min: 100_000, max: 1_000_000, step: 100_000 },
        b2c: { default: 10_000, min: 10_000, max: 100_000, step: 10_000 },
    },
} as SubscriptionConfiguratorContent

test("falls back to content defaults when the URL has no selection", () => {
    assert.deepEqual(parseSubscriptionSelectionFromSearchParams(new URLSearchParams(), content), {
        plan: "custom",
        deployment: "self_hosted",
        customerType: "b2c",
        paymentPeriod: "monthly",
        workflowExecutions: 10,
        aiTokens: 10_000,
    })
})

test("writes the resolved usage defaults back into the search params on a fresh page load", () => {
    const selection = parseSubscriptionSelectionFromSearchParams(new URLSearchParams(), content)
    const params = buildSubscriptionSelectionSearchParams(selection)

    assert.equal(params.get("workflowExecutions"), "10")
    assert.equal(params.get("aiTokens"), "10000")
})

test("restores a full selection from the URL", () => {
    const searchParams = new URLSearchParams({
        plan: "custom",
        deploymentType: "cloud",
        customerType: "b2b",
        paymentPeriod: "yearly",
        workflowExecutions: "500",
        aiTokens: "200000",
    })

    assert.deepEqual(parseSubscriptionSelectionFromSearchParams(searchParams, content), {
        plan: "custom",
        deployment: "cloud",
        customerType: "b2b",
        paymentPeriod: "yearly",
        workflowExecutions: 500,
        aiTokens: 200_000,
    })
})

test("forces the custom plan for b2b customers even if the URL requests a fixed plan", () => {
    const searchParams = new URLSearchParams({ plan: "pro", customerType: "b2b" })
    assert.equal(parseSubscriptionSelectionFromSearchParams(searchParams, content).plan, "custom")
})

test("clamps usage values restored from the URL to the customer type's range", () => {
    const searchParams = new URLSearchParams({ customerType: "b2c", workflowExecutions: "999999", aiTokens: "1" })
    const selection = parseSubscriptionSelectionFromSearchParams(searchParams, content)
    assert.equal(selection.workflowExecutions, 1_000)
    assert.equal(selection.aiTokens, 10_000)
})

test("ignores malformed or unknown URL values", () => {
    const searchParams = new URLSearchParams({ plan: "enterprise", customerType: "consumer", paymentPeriod: "biannual", workflowExecutions: "abc" })
    assert.deepEqual(parseSubscriptionSelectionFromSearchParams(searchParams, content), {
        plan: "custom",
        deployment: "self_hosted",
        customerType: "b2c",
        paymentPeriod: "monthly",
        workflowExecutions: 10,
        aiTokens: 10_000,
    })
})

test("restores a weekly payment period for a standard b2c plan from the URL", () => {
    const searchParams = new URLSearchParams({ customerType: "b2c", plan: "pro", paymentPeriod: "weekly" })
    assert.equal(parseSubscriptionSelectionFromSearchParams(searchParams, content).paymentPeriod, "weekly")
})

test("normalizes payment periods according to the selected plan", () => {
    const customWeeklySearchParams = new URLSearchParams({ customerType: "b2c", plan: "custom", paymentPeriod: "weekly" })
    assert.equal(parseSubscriptionSelectionFromSearchParams(customWeeklySearchParams, content).paymentPeriod, "monthly")

    const standardQuarterlySearchParams = new URLSearchParams({ customerType: "b2c", plan: "max", paymentPeriod: "quarterly" })
    assert.equal(parseSubscriptionSelectionFromSearchParams(standardQuarterlySearchParams, content).paymentPeriod, "monthly")

    assert.equal(getPaymentPeriodForPlan("custom", "weekly"), "monthly")
    assert.equal(getPaymentPeriodForPlan("custom", "quarterly"), "quarterly")
    assert.equal(getPaymentPeriodForPlan("pro", "quarterly"), "monthly")
    assert.equal(getPaymentPeriodForPlan("max", "weekly"), "weekly")
})

test("builds checkout search params with usage only for the custom plan", () => {
    const customSelection: SubscriptionSelection = {
        plan: "custom",
        deployment: "cloud",
        customerType: "b2b",
        paymentPeriod: "yearly",
        workflowExecutions: 500,
        aiTokens: 200_000,
    }
    assert.equal(buildSubscriptionSelectionSearchParams(customSelection).toString(), "plan=custom&deploymentType=cloud&customerType=b2b&paymentPeriod=yearly&workflowExecutions=500&aiTokens=200000")

    const fixedSelection: SubscriptionSelection = {
        plan: "pro",
        deployment: "self_hosted",
        customerType: "b2c",
        paymentPeriod: "monthly",
        workflowExecutions: 10,
        aiTokens: 10_000,
    }
    assert.equal(buildSubscriptionSelectionSearchParams(fixedSelection).toString(), "plan=pro&deploymentType=self_hosted&customerType=b2c&paymentPeriod=monthly")
})

test("snaps manipulated usage to the configured step", () => {
    const result = resolveSubscriptionSelection(new URLSearchParams({ customerType: "b2b", workflowExecutions: "251", aiTokens: "150000" }), content)
    assert.equal(result.selection.workflowExecutions, 300)
    assert.equal(result.selection.aiTokens, 200_000)
    assert.equal(result.issues.length, 2)
})

test("applies dependent customer-type rules through the reducer", () => {
    const initial = resolveSubscriptionSelection(new URLSearchParams({ customerType: "b2c", plan: "pro", paymentPeriod: "weekly" }), content).selection
    const next = reduceSubscriptionSelection(initial, { type: "customerTypeChanged", value: "b2b" }, content)
    assert.equal(next.plan, "custom")
    assert.equal(next.paymentPeriod, "monthly")
})

test("normalizes the payment period when switching between standard and custom plans", () => {
    const standardWeekly = resolveSubscriptionSelection(new URLSearchParams({ customerType: "b2c", plan: "pro", paymentPeriod: "weekly" }), content).selection
    const custom = reduceSubscriptionSelection(standardWeekly, { type: "planChanged", value: "custom" }, content)
    assert.equal(custom.plan, "custom")
    assert.equal(custom.paymentPeriod, "monthly")

    const customQuarterly = resolveSubscriptionSelection(new URLSearchParams({ customerType: "b2c", plan: "custom", paymentPeriod: "quarterly" }), content).selection
    const standard = reduceSubscriptionSelection(customQuarterly, { type: "planChanged", value: "max" }, content)
    assert.equal(standard.plan, "max")
    assert.equal(standard.paymentPeriod, "monthly")
})

test("restricts B2B customers to the custom plan", () => {
    assert.equal(getPlanForCustomerType("b2b", "pro"), "custom")
    assert.equal(getPlanForCustomerType("b2b", "max"), "custom")
    assert.equal(getPlanForCustomerType("b2c", "max"), "max")
})
