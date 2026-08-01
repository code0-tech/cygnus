import assert from "node:assert/strict"
import test from "node:test"
import { createEmptyBillingDetails, getBillingStepStatus } from "../../src/lib/checkout/billingDetails"

test("derives checkout step completion from one billing validator", () => {
    const empty = createEmptyBillingDetails()
    assert.deepEqual(getBillingStepStatus(empty, "personal"), { contact: false, address: false, hasTax: false, tax: true, complete: false })

    const complete = { ...empty, name: "Ada Lovelace", email: "ada@example.com", line1: "1 Main St", postalCode: "12345", city: "Berlin", country: "DE" }
    assert.deepEqual(getBillingStepStatus(complete, "personal"), { contact: true, address: true, hasTax: false, tax: true, complete: true })
    assert.equal(getBillingStepStatus(complete, "business").complete, false)
    assert.equal(getBillingStepStatus({ ...complete, taxIdType: "eu_vat", taxIdValue: "DE123" }, "business").complete, true)
})
