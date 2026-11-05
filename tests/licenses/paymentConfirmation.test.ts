import assert from "node:assert/strict"
import test from "node:test"
import type { Stripe } from "@stripe/stripe-js"
import { confirmInvoicePayment, getPaymentPollDelay, isAwaitedPaymentSettled, isInvoiceOpen } from "../../src/lib/licenses/paymentConfirmation"
import type { LicenseDashboardLicense } from "../../src/lib/licenses/types"

function fakeStripe(retrievedStatus: string | null, nextActionStatus: string | null = null) {
    const calls: string[] = []
    const stripe = {
        retrievePaymentIntent: async (clientSecret: string) => {
            calls.push(`retrieve:${clientSecret}`)
            return retrievedStatus ? { paymentIntent: { status: retrievedStatus } } : { error: { type: "invalid_request_error" } }
        },
        handleNextAction: async ({ clientSecret }: { clientSecret: string }) => {
            calls.push(`nextAction:${clientSecret}`)
            return nextActionStatus ? { paymentIntent: { status: nextActionStatus } } : { error: { type: "card_error" } }
        },
    }
    return { calls, stripe: stripe as unknown as Stripe }
}

test("a payment waiting for 3D Secure is confirmed through Stripe's next action", async () => {
    const { calls, stripe } = fakeStripe("requires_action", "succeeded")

    assert.equal(await confirmInvoicePayment(stripe, "pi_1_secret_2"), "succeeded")
    assert.deepEqual(calls, ["retrieve:pi_1_secret_2", "nextAction:pi_1_secret_2"])
})

test("an aborted or declined authentication leaves the payment failed", async () => {
    assert.equal(await confirmInvoicePayment(fakeStripe("requires_action", null).stripe, "pi_secret"), "failed")
    assert.equal(await confirmInvoicePayment(fakeStripe("requires_action", "requires_payment_method").stripe, "pi_secret"), "failed")
})

test("a payment Stripe settles asynchronously is reported as processing", async () => {
    assert.equal(await confirmInvoicePayment(fakeStripe("requires_action", "processing").stripe, "pi_secret"), "processing")
    assert.equal(await confirmInvoicePayment(fakeStripe("processing").stripe, "pi_secret"), "processing")
})

test("a payment that needs no action is not confirmed again", async () => {
    const paid = fakeStripe("succeeded")
    assert.equal(await confirmInvoicePayment(paid.stripe, "pi_secret"), "succeeded")
    assert.deepEqual(paid.calls, ["retrieve:pi_secret"])

    const withoutMethod = fakeStripe("requires_payment_method")
    assert.equal(await confirmInvoicePayment(withoutMethod.stripe, "pi_secret"), "failed")
    assert.deepEqual(withoutMethod.calls, ["retrieve:pi_secret"])
})

test("a missing Stripe instance or an unreadable PaymentIntent fails without throwing", async () => {
    assert.equal(await confirmInvoicePayment(null, "pi_secret"), "failed")
    assert.equal(await confirmInvoicePayment(fakeStripe(null).stripe, "pi_secret"), "failed")
})

const license = (values: Partial<LicenseDashboardLicense>) => ({ id: "gid://crater/Subscription/1", customerId: "gid://crater/Customer/1", ...values }) as LicenseDashboardLicense

test("the payment poll backs off up to ten seconds between reloads", () => {
    assert.deepEqual([0, 1, 2, 3, 8].map(getPaymentPollDelay), [2_000, 4_000, 8_000, 10_000, 10_000])
})

test("a paid invoice only counts once the dashboard reports it as paid", () => {
    const payment = { licenseId: "gid://crater/Subscription/1", invoiceId: "gid://crater/Invoice/7" }

    assert.equal(isAwaitedPaymentSettled([license({ invoices: [{ id: "gid://crater/Invoice/7", status: "OPEN" }] })], payment), false)
    assert.equal(isAwaitedPaymentSettled([license({ invoices: [{ id: "gid://crater/Invoice/7", status: "PAID" }] })], payment), true)
    assert.equal(isAwaitedPaymentSettled([], payment), false)
})

test("a confirmed upgrade counts once Crater applied its pending selection", () => {
    const payment = { licenseId: "gid://crater/Subscription/1", pendingUpdateApplied: true }
    const pendingUpdate = { effectiveAt: "2026-11-05T12:00:00Z", paymentPeriod: "monthly", plan: "max" } as LicenseDashboardLicense["pendingUpdate"]

    assert.equal(isAwaitedPaymentSettled([license({ pendingUpdate, plan: "pro" })], payment), false)
    assert.equal(isAwaitedPaymentSettled([license({ pendingUpdate: null, plan: "max" })], payment), true)
    // A failed confirmation only waits for the reload that brings in the open invoice.
    assert.equal(isAwaitedPaymentSettled([license({ pendingUpdate, plan: "pro" })], { licenseId: payment.licenseId }), true)
})

test("only open invoices are offered for payment", () => {
    assert.equal(isInvoiceOpen({ id: "1", status: " OPEN " }), true)
    assert.equal(isInvoiceOpen({ id: "2", status: "PAID" }), false)
    assert.equal(isInvoiceOpen({ id: "3" }), false)
})
