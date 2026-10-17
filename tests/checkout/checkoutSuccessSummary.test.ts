import assert from "node:assert/strict"
import test from "node:test"
import { buildCheckoutSuccessSummary } from "@/lib/checkout/checkoutSuccessSummary"
import type { SubscriptionConfigData } from "@/lib/cms"

const subscriptionConfig = {
    defaults: { customerType: "b2c", deployment: "self_hosted", paymentPeriod: { b2b: "monthly", b2c: "monthly" } },
    paymentPeriod: {
        monthlyPeriodSuffix: "per month",
        monthlyText: "Monthly",
        quarterlyPeriodSuffix: "per quarter",
        quarterlyText: "Quarterly",
        weeklyPeriodSuffix: "per week",
        weeklyText: "Weekly",
        yearlyPeriodSuffix: "per year",
        yearlyText: "Yearly",
    },
} as unknown as SubscriptionConfigData

test("resolves the success deployment without reconstructing a price", () => {
    const summary = buildCheckoutSuccessSummary({
        searchParams: new URLSearchParams({ plan: "pro", customerType: "b2b", paymentPeriod: "quarterly" }),
        subscriptionConfig,
    })

    assert.deepEqual(summary, { deployment: "self_hosted" })
})

test("keeps the selected deployment for success actions", () => {
    const summary = buildCheckoutSuccessSummary({
        searchParams: new URLSearchParams({ plan: "pro", customerType: "b2c", deploymentType: "cloud", paymentPeriod: "yearly" }),
        subscriptionConfig,
    })

    assert.deepEqual(summary, { deployment: "cloud" })
})

test("stays absent without a plan or subscription configuration", () => {
    assert.equal(buildCheckoutSuccessSummary({ searchParams: new URLSearchParams({ session_id: "cs_test" }), subscriptionConfig }), null)
    assert.equal(buildCheckoutSuccessSummary({ searchParams: new URLSearchParams({ plan: "pro" }), subscriptionConfig: null }), null)
})
