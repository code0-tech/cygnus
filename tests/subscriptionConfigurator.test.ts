import assert from "node:assert/strict"
import test from "node:test"
import type { SubscriptionConfiguratorContent } from "../src/lib/cms"
import {
    buildSubscriptionSelectionSearchParams,
    getPaymentPeriodForCustomerType,
    getPaymentPeriodOptions,
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

test("keeps a fixed plan for b2b customers", () => {
    const searchParams = new URLSearchParams({ plan: "pro", customerType: "b2b" })
    assert.equal(parseSubscriptionSelectionFromSearchParams(searchParams, content).plan, "pro")
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

test("restores a weekly payment period for any b2c plan from the URL", () => {
    const customSearchParams = new URLSearchParams({ customerType: "b2c", plan: "custom", paymentPeriod: "weekly" })
    assert.equal(parseSubscriptionSelectionFromSearchParams(customSearchParams, content).paymentPeriod, "weekly")

    const fixedSearchParams = new URLSearchParams({ customerType: "b2c", plan: "pro", paymentPeriod: "weekly" })
    assert.equal(parseSubscriptionSelectionFromSearchParams(fixedSearchParams, content).paymentPeriod, "weekly")
})

test("normalizes payment periods according to the customer type, not the plan", () => {
    const b2cQuarterlySearchParams = new URLSearchParams({ customerType: "b2c", plan: "custom", paymentPeriod: "quarterly" })
    assert.equal(parseSubscriptionSelectionFromSearchParams(b2cQuarterlySearchParams, content).paymentPeriod, "monthly")

    const b2bWeeklySearchParams = new URLSearchParams({ customerType: "b2b", plan: "max", paymentPeriod: "weekly" })
    assert.equal(parseSubscriptionSelectionFromSearchParams(b2bWeeklySearchParams, content).paymentPeriod, "monthly")

    const b2bQuarterlySearchParams = new URLSearchParams({ customerType: "b2b", plan: "pro", paymentPeriod: "quarterly" })
    assert.equal(parseSubscriptionSelectionFromSearchParams(b2bQuarterlySearchParams, content).paymentPeriod, "quarterly")

    assert.equal(getPaymentPeriodForCustomerType("b2b", "weekly"), "monthly")
    assert.equal(getPaymentPeriodForCustomerType("b2b", "quarterly"), "quarterly")
    assert.equal(getPaymentPeriodForCustomerType("b2c", "quarterly"), "monthly")
    assert.equal(getPaymentPeriodForCustomerType("b2c", "weekly"), "weekly")

    assert.deepEqual([...getPaymentPeriodOptions("b2b")], ["monthly", "quarterly", "yearly"])
    assert.deepEqual([...getPaymentPeriodOptions("b2c")], ["weekly", "monthly", "yearly"])
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
    assert.equal(next.plan, "pro")
    assert.equal(next.paymentPeriod, "monthly")
    assert.equal(next.workflowExecutions, 200)
    assert.equal(next.aiTokens, 100_000)

    const backToB2c = reduceSubscriptionSelection({ ...next, paymentPeriod: "quarterly" }, { type: "customerTypeChanged", value: "b2c" }, content)
    assert.equal(backToB2c.paymentPeriod, "monthly")
})

test("keeps the payment period when switching between plans of the same customer type", () => {
    const b2cWeekly = resolveSubscriptionSelection(new URLSearchParams({ customerType: "b2c", plan: "pro", paymentPeriod: "weekly" }), content).selection
    const custom = reduceSubscriptionSelection(b2cWeekly, { type: "planChanged", value: "custom" }, content)
    assert.equal(custom.plan, "custom")
    assert.equal(custom.paymentPeriod, "weekly")

    const b2bQuarterly = resolveSubscriptionSelection(new URLSearchParams({ customerType: "b2b", plan: "custom", paymentPeriod: "quarterly" }), content).selection
    const max = reduceSubscriptionSelection(b2bQuarterly, { type: "planChanged", value: "max" }, content)
    assert.equal(max.plan, "max")
    assert.equal(max.paymentPeriod, "quarterly")
})

test("rejects a payment period the customer type is not billed in through the reducer", () => {
    const b2b = resolveSubscriptionSelection(new URLSearchParams({ customerType: "b2b", plan: "pro" }), content).selection
    assert.equal(reduceSubscriptionSelection(b2b, { type: "paymentPeriodChanged", value: "weekly" }, content).paymentPeriod, "monthly")
    assert.equal(reduceSubscriptionSelection(b2b, { type: "paymentPeriodChanged", value: "quarterly" }, content).paymentPeriod, "quarterly")
})
