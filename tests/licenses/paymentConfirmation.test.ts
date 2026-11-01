import assert from "node:assert/strict"
import test from "node:test"
import type { Stripe } from "@stripe/stripe-js"
import { confirmInvoicePayment } from "../../src/lib/licenses/paymentConfirmation"

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
