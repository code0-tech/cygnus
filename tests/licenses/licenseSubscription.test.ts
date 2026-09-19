import { resolveSubscriptionCustomerType } from "@/lib/licenses/licenseSubscription"
import assert from "node:assert/strict"
import test from "node:test"

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
