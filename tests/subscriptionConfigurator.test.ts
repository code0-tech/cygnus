import assert from "node:assert/strict"
import test from "node:test"
import type { SubscriptionConfiguratorContent } from "../src/lib/cms"
import {
    buildSubscriptionSelectionSearchParams,
    getPaymentPeriodForCustomerType,
    getPlanForCustomerType,
    getSubscriptionConfiguratorSteps,
    parseSelectedAdditionalFeatureIndexes,
    parseSubscriptionSelectionFromSearchParams,
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
    additionalFeatures: [
        { id: "sso", title: "SSO", description: "", icon: "", price: 10 },
        { title: "Support", description: "", icon: "", price: 5 },
    ],
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
    const params = buildSubscriptionSelectionSearchParams(selection, [])

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

test("restores a weekly payment period for b2c customers from the URL", () => {
    const searchParams = new URLSearchParams({ customerType: "b2c", paymentPeriod: "weekly" })
    assert.equal(parseSubscriptionSelectionFromSearchParams(searchParams, content).paymentPeriod, "weekly")
})

test("downgrades weekly to monthly for b2b and quarterly to monthly for b2c", () => {
    const b2bWeeklySearchParams = new URLSearchParams({ customerType: "b2b", paymentPeriod: "weekly" })
    assert.equal(parseSubscriptionSelectionFromSearchParams(b2bWeeklySearchParams, content).paymentPeriod, "monthly")

    const b2cQuarterlySearchParams = new URLSearchParams({ customerType: "b2c", paymentPeriod: "quarterly" })
    assert.equal(parseSubscriptionSelectionFromSearchParams(b2cQuarterlySearchParams, content).paymentPeriod, "monthly")

    assert.equal(getPaymentPeriodForCustomerType("b2b", "weekly"), "monthly")
    assert.equal(getPaymentPeriodForCustomerType("b2c", "quarterly"), "monthly")
    assert.equal(getPaymentPeriodForCustomerType("b2b", "quarterly"), "quarterly")
    assert.equal(getPaymentPeriodForCustomerType("b2c", "weekly"), "weekly")
})

test("resolves selected additional features by id, falling back to index", () => {
    assert.deepEqual(parseSelectedAdditionalFeatureIndexes(new URLSearchParams({ additionalFeatures: "sso,1" }), content.additionalFeatures), new Set([0, 1]))
    assert.deepEqual(parseSelectedAdditionalFeatureIndexes(new URLSearchParams(), content.additionalFeatures), new Set())
})

test("builds checkout search params only with usage and features for the custom plan", () => {
    const customSelection: SubscriptionSelection = { plan: "custom", deployment: "cloud", customerType: "b2b", paymentPeriod: "yearly", workflowExecutions: 500, aiTokens: 200_000 }
    assert.equal(
        buildSubscriptionSelectionSearchParams(customSelection, ["sso"]).toString(),
        "plan=custom&deploymentType=cloud&customerType=b2b&paymentPeriod=yearly&workflowExecutions=500&aiTokens=200000&additionalFeatures=sso"
    )

    const fixedSelection: SubscriptionSelection = { plan: "pro", deployment: "self_hosted", customerType: "b2c", paymentPeriod: "monthly", workflowExecutions: 10, aiTokens: 10_000 }
    assert.equal(buildSubscriptionSelectionSearchParams(fixedSelection, []).toString(), "plan=pro&deploymentType=self_hosted&customerType=b2c&paymentPeriod=monthly")
})

test("builds the custom-plan wizard in the requested order", () => {
    assert.deepEqual(getSubscriptionConfiguratorSteps("b2c", "custom", true), ["customerType", "plan", "deployment", "aiTokens", "workflowExecutions", "additionalFeatures", "paymentPeriod"])
})

test("skips custom usage steps for fixed plans", () => {
    assert.deepEqual(getSubscriptionConfiguratorSteps("b2c", "pro", true), ["customerType", "plan", "deployment", "paymentPeriod"])
    assert.deepEqual(getSubscriptionConfiguratorSteps("b2c", "max", false), ["customerType", "plan", "deployment", "paymentPeriod"])
})

test("skips the plan step entirely for b2b customers, who are always on the custom plan", () => {
    assert.deepEqual(getSubscriptionConfiguratorSteps("b2b", "custom", true), ["customerType", "deployment", "aiTokens", "workflowExecutions", "additionalFeatures", "paymentPeriod"])
})

test("restricts B2B customers to the custom plan", () => {
    assert.equal(getPlanForCustomerType("b2b", "pro"), "custom")
    assert.equal(getPlanForCustomerType("b2b", "max"), "custom")
    assert.equal(getPlanForCustomerType("b2c", "max"), "max")
})
