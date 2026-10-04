import assert from "node:assert/strict"
import test from "node:test"
import type { SubscriptionStatus, CheckoutPlan, CheckoutPaymentPeriod, Customer, Subscription } from "@code0-tech/crater-graphql-types"
import { deriveLicenseStatus, mapCustomer, mapSubscription } from "../../src/lib/licenses/licenseDashboardMapper"

const customer: Customer = { id: "gid://crater/Customer/1", name: "Customer", subscriptions: { count: 3 } }
const subscription: Subscription = {
    id: "gid://crater/Subscription/2",
    status: "ACTIVE" as SubscriptionStatus,
    plan: "PRO" as CheckoutPlan,
    paymentPeriod: "MONTHLY" as CheckoutPaymentPeriod,
    currentLicense: { id: "gid://crater/License/3" },
}

test("preserves every subscription status and marks absent snapshots pending", () => {
    for (const status of ["ACTIVE", "CANCELED", "INCOMPLETE", "INCOMPLETE_EXPIRED", "PAST_DUE", "PAUSED", "TRIALING", "UNPAID"]) {
        assert.equal(deriveLicenseStatus(status, true), status)
        assert.equal(deriveLicenseStatus(status, false), "pending")
    }
    assert.equal(mapCustomer(customer)?.subscriptionCount, 3)
})

test("renewals preserve the subscription route id and change only the export id", () => {
    const first = mapSubscription(subscription, customer)!
    const renewed = mapSubscription({ ...subscription, currentLicense: { id: "gid://crater/License/4" } }, customer)!
    assert.equal(first.id, renewed.id)
    assert.equal(renewed.subscriptionId, subscription.id)
    assert.notEqual(first.licenseId, renewed.licenseId)
})

test("maps a scheduled selection without replacing the currently active selection", () => {
    const mapped = mapSubscription(
        {
            ...subscription,
            pendingUpdate: { plan: "MAX" as CheckoutPlan, paymentPeriod: "YEARLY" as CheckoutPaymentPeriod, aiTokens: 0, workflowExecutions: 100000, effectiveAt: "2026-11-01T00:00:00Z" },
        },
        customer
    )!
    assert.equal(mapped.plan, "pro")
    assert.equal(mapped.paymentPeriod, "monthly")
    assert.deepEqual(mapped.pendingUpdate, { plan: "max", paymentPeriod: "yearly", aiTokens: 0, workflowExecutions: 100000, effectiveAt: "2026-11-01T00:00:00Z" })
    assert.equal(mapSubscription(subscription, customer)?.pendingUpdate, null)
})

test("maps invoice creation dates, positions and zero tax in minor units", () => {
    const mapped = mapSubscription(
        {
            ...subscription,
            currentLicense: {
                ...subscription.currentLicense,
                invoices: {
                    nodes: [
                        null,
                        {
                            id: "gid://crater/Invoice/1",
                            createdAt: "2026-10-01T00:00:00Z",
                            currency: "eur",
                            net: 1200,
                            tax: 0,
                            total: 1200,
                            lineItems: [{ description: "Pro", amount: 1200, quantity: 1 }],
                        },
                    ],
                },
            },
        },
        customer
    )!
    assert.deepEqual(mapped.invoices, [
        { id: "gid://crater/Invoice/1", createdAt: "2026-10-01T00:00:00Z", currency: "eur", net: 1200, tax: 0, total: 1200, lineItems: [{ description: "Pro", amount: 1200, quantity: 1 }] },
    ])
})
