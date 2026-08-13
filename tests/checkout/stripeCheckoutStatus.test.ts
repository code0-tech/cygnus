import assert from "node:assert/strict"
import test from "node:test"
import { getCheckoutSessionValidationStatus } from "../../src/lib/checkout/stripeCheckoutStatus"

test("accepts only completed Stripe Checkout Sessions", () => {
    assert.equal(getCheckoutSessionValidationStatus({ status: "complete" }), "complete")
    assert.equal(getCheckoutSessionValidationStatus({ status: "open" }), "incomplete")
    assert.equal(getCheckoutSessionValidationStatus({ status: "expired" }), "incomplete")
})
