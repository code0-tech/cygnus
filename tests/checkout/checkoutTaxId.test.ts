import assert from "node:assert/strict"
import { test } from "node:test"
import { getTaxIdInfoFromDraft, type CheckoutTaxIdDraft } from "../../src/lib/checkout/stripeCheckout"

const draft = (overrides: Partial<CheckoutTaxIdDraft> = {}, value: Partial<CheckoutTaxIdDraft["value"]> = {}): CheckoutTaxIdDraft => ({
    complete: true,
    empty: false,
    visible: true,
    ...overrides,
    value: { businessName: " Code0 GmbH ", taxId: " DE123456789 ", taxIdType: "de_vat", externalTaxIdType: "eu_vat", ...value },
})

test("maps the tax ID element value onto the session tax ID info with the Stripe API type", () => {
    assert.deepEqual(getTaxIdInfoFromDraft(draft()), {
        businessName: "Code0 GmbH",
        taxId: { type: "eu_vat", value: "DE123456789" },
    })
})

test("clears the tax ID when the element is hidden, empty, or has no tax ID", () => {
    assert.equal(getTaxIdInfoFromDraft(draft({ visible: false })), null)
    assert.equal(getTaxIdInfoFromDraft(draft({ empty: true })), null)
    assert.equal(getTaxIdInfoFromDraft(draft({}, { taxId: "  " })), null)
})
