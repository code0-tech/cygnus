import assert from "node:assert/strict"
import test from "node:test"
import { parseCheckoutSessionId } from "../../src/lib/checkout/checkoutReturn"

test("accepts Stripe Checkout Session ids from the return URL", () => {
    assert.equal(parseCheckoutSessionId("cs_test_a1B2c3D4"), "cs_test_a1B2c3D4")
    assert.equal(parseCheckoutSessionId("cs_live_a1B2c3D4"), "cs_live_a1B2c3D4")
})

test("rejects missing or malformed checkout return ids", () => {
    assert.equal(parseCheckoutSessionId(undefined), null)
    assert.equal(parseCheckoutSessionId(["cs_test_a1B2c3D4"]), null)
    assert.equal(parseCheckoutSessionId("pi_test_a1B2c3D4"), null)
    assert.equal(parseCheckoutSessionId("cs_test_<script>"), null)
})
