import assert from "node:assert/strict"
import test from "node:test"
import type { SubscriptionConfigData } from "@/lib/cms"
import { normalizeCheckoutSelection, validateCheckoutSelection } from "@/lib/checkout/checkoutValidation"

const subscriptionConfig = {
    aiTokens: {
        b2b: { default: 200_000, min: 100_000, max: 1_000_000, step: 100_000 },
        b2c: { default: 20_000, min: 10_000, max: 100_000, step: 10_000 },
    },
    defaults: {
        customerType: "b2c",
        paymentPeriod: { b2b: "monthly", b2c: "monthly" },
    },
    workflowExecutions: {
        b2b: { default: 1_000, min: 200, max: 10_000, step: 100 },
        b2c: { default: 100, min: 10, max: 1_000, step: 10 },
    },
} as SubscriptionConfigData

test("accepts usage values matching the selected customer configuration", () => {
    assert.deepEqual(
        validateCheckoutSelection(
            {
                aiTokens: "500000",
                customerType: "b2b",
                paymentPeriod: "quarterly",
                plan: "custom",
                workflowExecutions: "1200",
            },
            subscriptionConfig
        ),
        { valid: true }
    )
})

test("clamps custom checkout usage to the configured minimum and maximum", () => {
    const normalizedSelection = normalizeCheckoutSelection(
        {
            aiTokens: "500000",
            customerType: "b2c",
            paymentPeriod: "monthly",
            plan: "custom",
            workflowExecutions: "1",
        },
        subscriptionConfig
    )

    assert.deepEqual(normalizedSelection, {
        aiTokens: "100000",
        customerType: "b2c",
        paymentPeriod: "monthly",
        plan: "custom",
        workflowExecutions: "10",
    })
    assert.deepEqual(validateCheckoutSelection(normalizedSelection, subscriptionConfig), { valid: true })
})

test("rejects usage values that do not match the configured step", () => {
    assert.deepEqual(
        validateCheckoutSelection(
            {
                aiTokens: "150000",
                customerType: "b2b",
                paymentPeriod: "yearly",
                plan: "custom",
                workflowExecutions: "250",
            },
            subscriptionConfig
        ),
        {
            valid: false,
            details: ["workflowExecutions must use increments of 100 starting at 200.", "aiTokens must use increments of 100000 starting at 100000."],
        }
    )
})

test("rejects invalid customer types, periods, and numeric formats", () => {
    assert.deepEqual(
        validateCheckoutSelection(
            {
                aiTokens: "1e6",
                customerType: "enterprise",
                paymentPeriod: "biannual",
                plan: "custom",
                workflowExecutions: "200.5",
            },
            subscriptionConfig
        ),
        {
            valid: false,
            details: ["paymentPeriod must be weekly, monthly, quarterly, or yearly.", "customerType must be b2b or b2c for a custom checkout."],
        }
    )
})

test("downgrades weekly to monthly for b2b customers and quarterly to monthly for b2c customers", () => {
    assert.equal(normalizeCheckoutSelection({ customerType: "b2b", paymentPeriod: "weekly", plan: "custom" }, subscriptionConfig).paymentPeriod, "monthly")
    assert.equal(normalizeCheckoutSelection({ customerType: "b2c", paymentPeriod: "quarterly", plan: "custom" }, subscriptionConfig).paymentPeriod, "monthly")
})

test("leaves weekly for b2c and quarterly for b2b customers untouched", () => {
    assert.equal(normalizeCheckoutSelection({ customerType: "b2c", paymentPeriod: "weekly", plan: "custom" }, subscriptionConfig).paymentPeriod, "weekly")
    assert.equal(normalizeCheckoutSelection({ customerType: "b2b", paymentPeriod: "quarterly", plan: "custom" }, subscriptionConfig).paymentPeriod, "quarterly")
})

test("downgrades pro/max to custom for b2b customers and fills in default usage values", () => {
    const normalizedSelection = normalizeCheckoutSelection(
        {
            customerType: "b2b",
            paymentPeriod: "yearly",
            plan: "pro",
        },
        subscriptionConfig
    )

    assert.deepEqual(normalizedSelection, {
        customerType: "b2b",
        paymentPeriod: "yearly",
        plan: "custom",
        aiTokens: "200000",
        workflowExecutions: "1000",
    })
    assert.deepEqual(validateCheckoutSelection(normalizedSelection, subscriptionConfig), { valid: true })
})

test("leaves pro/max untouched for b2c customers", () => {
    assert.deepEqual(
        normalizeCheckoutSelection(
            {
                customerType: "b2c",
                paymentPeriod: "monthly",
                plan: "max",
            },
            subscriptionConfig
        ),
        {
            customerType: "b2c",
            paymentPeriod: "monthly",
            plan: "max",
        }
    )
})

test("rejects non-integer usage values", () => {
    assert.deepEqual(
        validateCheckoutSelection(
            {
                aiTokens: "1e6",
                customerType: "b2b",
                paymentPeriod: "monthly",
                plan: "custom",
                workflowExecutions: "200.5",
            },
            subscriptionConfig
        ),
        {
            valid: false,
            details: ["workflowExecutions must be a non-negative integer.", "aiTokens must be a non-negative integer."],
        }
    )
})
