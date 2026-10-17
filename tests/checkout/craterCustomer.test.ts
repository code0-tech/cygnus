import assert from "node:assert/strict"
import test from "node:test"
import { normalizeCountryCode, resolveCraterCustomerType } from "@/lib/checkout/craterCustomer"

test("maps checkout customer types to Crater customer types", () => {
    assert.equal(resolveCraterCustomerType("b2b"), "business")
    assert.equal(resolveCraterCustomerType("b2c"), "personal")
    assert.equal(resolveCraterCustomerType(null), "personal")
})

test("normalizes country codes for Crater customer addresses", () => {
    assert.equal(normalizeCountryCode(" de "), "DE")
    assert.equal(normalizeCountryCode(null), "")
})
