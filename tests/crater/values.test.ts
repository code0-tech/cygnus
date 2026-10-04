import assert from "node:assert/strict"
import test from "node:test"
import { normalizeCountryCode, parseCheckoutSessionId, resolveCraterCustomerType, resolveSubscriptionCustomerType } from "@/lib/crater/values"

test("maps checkout customer types to Crater customer types", () => {
    assert.equal(resolveCraterCustomerType("b2b"), "business")
    assert.equal(resolveCraterCustomerType("b2c"), "personal")
    assert.equal(resolveCraterCustomerType(null), "personal")
})

test("normalizes country codes for Crater customer addresses", () => {
    assert.equal(normalizeCountryCode(" de "), "DE")
    assert.equal(normalizeCountryCode(null), "")
})

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

test("maps Crater's business/personal customer type to b2b/b2c", () => {
    assert.equal(resolveSubscriptionCustomerType("business"), "b2b")
    assert.equal(resolveSubscriptionCustomerType("personal"), "b2c")
})

test("is case-insensitive and trims whitespace", () => {
    assert.equal(resolveSubscriptionCustomerType(" Business "), "b2b")
    assert.equal(resolveSubscriptionCustomerType("BUSINESS"), "b2b")
})

test("defaults to b2c for unknown or missing values", () => {
    assert.equal(resolveSubscriptionCustomerType(undefined), "b2c")
    assert.equal(resolveSubscriptionCustomerType(null), "b2c")
    assert.equal(resolveSubscriptionCustomerType(""), "b2c")
    assert.equal(resolveSubscriptionCustomerType("enterprise"), "b2c")
})
