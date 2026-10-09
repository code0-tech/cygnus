import { PAYMENT_PERIOD_OPTIONS, type SubscriptionSelection } from "@/lib/subscription/types"
import assert from "node:assert/strict"
import test from "node:test"
import type { SubscriptionSelectionCatalog } from "../../src/lib/subscription/catalog"
import {
    buildSubscriptionSelectionSearchParams,
    normalizePaymentPeriod,
    parseSubscriptionSelectionFromSearchParams,
    reduceSubscriptionSelection,
    resolveSubscriptionSelection,
} from "../../src/lib/subscription/configurator"

const content = {
    defaults: {
        deployment: "self_hosted",
        customerType: "b2c",
        paymentPeriod: { b2b: "monthly", b2c: "monthly" },
    },
    workflowExecutions: {
        b2b: { packages: [100_000, 1_000_000, 5_000_000, 10_000_000] },
        b2c: { packages: [10_000, 100_000, 500_000, 1_000_000] },
    },
    aiTokens: {
        b2b: { packages: [10_000_000, 100_000_000, 500_000_000, 1_000_000_000] },
        b2c: { packages: [1_000_000, 10_000_000, 50_000_000, 100_000_000] },
    },
} as SubscriptionSelectionCatalog

test("starts at the smallest Crater package when the URL has no selection", () => {
    assert.deepEqual(parseSubscriptionSelectionFromSearchParams(new URLSearchParams(), content), {
        plan: "custom",
        deployment: "self_hosted",
        customerType: "b2c",
        paymentPeriod: "monthly",
        workflowExecutions: 10_000,
        aiTokens: 1_000_000,
    })
})

test("writes the resolved usage defaults back into the search params on a fresh page load", () => {
    const selection = parseSubscriptionSelectionFromSearchParams(new URLSearchParams(), content)
    const params = buildSubscriptionSelectionSearchParams(selection)

    assert.equal(params.get("workflowExecutions"), "10000")
    assert.equal(params.get("aiTokens"), "1000000")
})

test("restores a full selection from the URL", () => {
    const searchParams = new URLSearchParams({
        plan: "custom",
        deploymentType: "cloud",
        customerType: "b2b",
        paymentPeriod: "yearly",
        workflowExecutions: "5000000",
        aiTokens: "500000000",
    })

    assert.deepEqual(parseSubscriptionSelectionFromSearchParams(searchParams, content), {
        plan: "custom",
        deployment: "cloud",
        customerType: "b2b",
        paymentPeriod: "yearly",
        workflowExecutions: 5_000_000,
        aiTokens: 500_000_000,
    })
})

test("keeps a fixed plan for b2b customers", () => {
    const searchParams = new URLSearchParams({ plan: "pro", customerType: "b2b" })
    assert.equal(parseSubscriptionSelectionFromSearchParams(searchParams, content).plan, "pro")
})

test("snaps usage values restored from the URL onto the customer type's packages", () => {
    const searchParams = new URLSearchParams({ customerType: "b2c", workflowExecutions: "999999", aiTokens: "1" })
    const selection = parseSubscriptionSelectionFromSearchParams(searchParams, content)
    assert.equal(selection.workflowExecutions, 1_000_000)
    assert.equal(selection.aiTokens, 1_000_000)

    const beyondLargest = parseSubscriptionSelectionFromSearchParams(new URLSearchParams({ customerType: "b2c", aiTokens: "999999999" }), content)
    assert.equal(beyondLargest.aiTokens, 100_000_000)
})

test("ignores malformed or unknown URL values", () => {
    const searchParams = new URLSearchParams({ plan: "enterprise", customerType: "consumer", paymentPeriod: "biannual", workflowExecutions: "abc" })
    assert.deepEqual(parseSubscriptionSelectionFromSearchParams(searchParams, content), {
        plan: "custom",
        deployment: "self_hosted",
        customerType: "b2c",
        paymentPeriod: "monthly",
        workflowExecutions: 10_000,
        aiTokens: 1_000_000,
    })
})

test("offers the same payment periods for both customer types", () => {
    const b2cQuarterlySearchParams = new URLSearchParams({ customerType: "b2c", plan: "custom", paymentPeriod: "quarterly" })
    assert.equal(parseSubscriptionSelectionFromSearchParams(b2cQuarterlySearchParams, content).paymentPeriod, "quarterly")

    const b2bWeeklySearchParams = new URLSearchParams({ customerType: "b2b", plan: "max", paymentPeriod: "weekly" })
    assert.equal(parseSubscriptionSelectionFromSearchParams(b2bWeeklySearchParams, content).paymentPeriod, "monthly")

    const b2bQuarterlySearchParams = new URLSearchParams({ customerType: "b2b", plan: "pro", paymentPeriod: "quarterly" })
    assert.equal(parseSubscriptionSelectionFromSearchParams(b2bQuarterlySearchParams, content).paymentPeriod, "quarterly")

    assert.equal(normalizePaymentPeriod("quarterly"), "quarterly")
    assert.equal(normalizePaymentPeriod("weekly"), "monthly")
    assert.equal(normalizePaymentPeriod(null), "monthly")

    assert.deepEqual([...PAYMENT_PERIOD_OPTIONS], ["monthly", "quarterly", "yearly"])
})

test("builds checkout search params with usage only for the custom plan", () => {
    const customSelection: SubscriptionSelection = {
        plan: "custom",
        deployment: "cloud",
        customerType: "b2b",
        paymentPeriod: "yearly",
        workflowExecutions: 5_000_000,
        aiTokens: 500_000_000,
    }
    assert.equal(
        buildSubscriptionSelectionSearchParams(customSelection).toString(),
        "plan=custom&deploymentType=cloud&customerType=b2b&paymentPeriod=yearly&workflowExecutions=5000000&aiTokens=500000000"
    )

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

test("snaps manipulated usage onto the next package and reports it", () => {
    const result = resolveSubscriptionSelection(new URLSearchParams({ customerType: "b2b", workflowExecutions: "251", aiTokens: "150000000" }), content)
    assert.equal(result.selection.workflowExecutions, 100_000)
    assert.equal(result.selection.aiTokens, 500_000_000)
    assert.equal(result.issues.length, 2)
})

test("normalizes Crater quantity steps and defaults to the smallest package", () => {
    const craterPackages = {
        ...content,
        aiTokens: { ...content.aiTokens, b2c: { packages: [50_000_000, 1_000_000, 10_000_000] } },
    } as SubscriptionSelectionCatalog
    assert.equal(parseSubscriptionSelectionFromSearchParams(new URLSearchParams({ customerType: "b2c" }), craterPackages).aiTokens, 1_000_000)
})

test("applies dependent customer-type rules through the reducer", () => {
    const initial = resolveSubscriptionSelection(new URLSearchParams({ customerType: "b2c", plan: "pro", paymentPeriod: "quarterly" }), content).selection
    const next = reduceSubscriptionSelection(initial, { type: "customerTypeChanged", value: "b2b" }, content)
    assert.equal(next.plan, "pro")
    assert.equal(next.paymentPeriod, "quarterly")
    assert.equal(next.workflowExecutions, 100_000)
    assert.equal(next.aiTokens, 10_000_000)

    const backToB2c = reduceSubscriptionSelection({ ...next, paymentPeriod: "quarterly" }, { type: "customerTypeChanged", value: "b2c" }, content)
    assert.equal(backToB2c.paymentPeriod, "quarterly")
})

test("keeps the payment period when switching between plans of the same customer type", () => {
    const b2cQuarterly = resolveSubscriptionSelection(new URLSearchParams({ customerType: "b2c", plan: "pro", paymentPeriod: "quarterly" }), content).selection
    const custom = reduceSubscriptionSelection(b2cQuarterly, { type: "planChanged", value: "custom" }, content)
    assert.equal(custom.plan, "custom")
    assert.equal(custom.paymentPeriod, "quarterly")

    const b2bQuarterly = resolveSubscriptionSelection(new URLSearchParams({ customerType: "b2b", plan: "custom", paymentPeriod: "quarterly" }), content).selection
    const max = reduceSubscriptionSelection(b2bQuarterly, { type: "planChanged", value: "max" }, content)
    assert.equal(max.plan, "max")
    assert.equal(max.paymentPeriod, "quarterly")
})

test("accepts every supported payment period for both customer types through the reducer", () => {
    const b2b = resolveSubscriptionSelection(new URLSearchParams({ customerType: "b2b", plan: "pro" }), content).selection
    assert.equal(reduceSubscriptionSelection(b2b, { type: "paymentPeriodChanged", value: "quarterly" }, content).paymentPeriod, "quarterly")
    const b2c = resolveSubscriptionSelection(new URLSearchParams({ customerType: "b2c", plan: "pro" }), content).selection
    assert.equal(reduceSubscriptionSelection(b2c, { type: "paymentPeriodChanged", value: "quarterly" }, content).paymentPeriod, "quarterly")
})
