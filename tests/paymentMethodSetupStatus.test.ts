import assert from "node:assert/strict"
import test from "node:test"
import { getPaymentMethodSetupStatus } from "../src/lib/licenses/paymentMethodSetupStatus"

type SetupIntent = Parameters<typeof getPaymentMethodSetupStatus>[0]
type Customer = NonNullable<Parameters<typeof getPaymentMethodSetupStatus>[1]>

function setupIntent(overrides: Partial<SetupIntent> = {}): SetupIntent {
    return {
        customer: "cus_example",
        metadata: { crater_customer_id: "7", purpose: "default_payment_method" },
        payment_method: "pm_new",
        status: "succeeded",
        ...overrides,
    } as SetupIntent
}

function customer(defaultPaymentMethod: string | null): Customer {
    return {
        id: "cus_example",
        invoice_settings: { default_payment_method: defaultPaymentMethod },
    } as Customer
}

test("keeps a succeeded SetupIntent pending until the webhook promotes its payment method", () => {
    assert.equal(getPaymentMethodSetupStatus(setupIntent(), customer("pm_old"), "7"), "pending")
})

test("marks payment method setup ready only when the collected method is the customer default", () => {
    assert.equal(getPaymentMethodSetupStatus(setupIntent(), customer("pm_new"), "7"), "ready")
})

test("keeps asynchronous SetupIntents pending before Stripe reports success", () => {
    assert.equal(getPaymentMethodSetupStatus(setupIntent({ status: "processing" }), null, "7"), "pending")
})

test("rejects SetupIntents that do not belong to the Crater customer", () => {
    assert.equal(getPaymentMethodSetupStatus(setupIntent(), customer("pm_new"), "8"), "invalid")
})
