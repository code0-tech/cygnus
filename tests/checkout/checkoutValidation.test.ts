import assert from "node:assert/strict"
import test from "node:test"
import type { SubscriptionConfigData } from "@/lib/cms"
import { normalizeCheckoutSelection, validateCheckoutSelection } from "@/lib/checkout/checkoutValidation"

const subscriptionConfig = {
    aiTokens: {
        b2b: { min: 100_000, max: 1_000_000, step: 100_000 },
        b2c: { min: 10_000, max: 100_000, step: 10_000 },
    },
    workflowExecutions: {
        b2b: { min: 200, max: 10_000, step: 100 },
        b2c: { min: 10, max: 1_000, step: 10 },
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
                paymentPeriod: "weekly",
                plan: "custom",
                workflowExecutions: "200.5",
            },
            subscriptionConfig
        ),
        {
            valid: false,
            details: ["paymentPeriod must be monthly, quarterly, or yearly.", "customerType must be b2b or b2c for a custom checkout."],
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
