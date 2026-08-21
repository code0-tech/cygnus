import assert from "node:assert/strict"
import test, { afterEach } from "node:test"
import { clearCheckoutDraftKeys, getCheckoutContactDraftCustomerId, readCheckoutContactDraft, saveCheckoutContactDraft } from "../../src/lib/checkout/checkoutDraft"
import { installDomTestEnvironment } from "./domTestEnvironment"

installDomTestEnvironment()

const billingAddress = {
    name: "Ada Lovelace",
    address: {
        city: "Berlin",
        country: "DE",
        line1: "Teststrasse 1",
        line2: null,
        postal_code: "10115",
        state: "Berlin",
    },
}

afterEach(() => window.sessionStorage.clear())

test("keeps a newly selected customer even before contact details were entered", () => {
    const searchParams = new URLSearchParams("plan=pro&paymentPeriod=monthly&promotionCode=SAVE10")
    saveCheckoutContactDraft({
        billingAddress: null,
        customerId: "gid://crater/Customer/new",
        email: null,
        searchParams,
        stage: "billingAddress",
    })

    assert.equal(getCheckoutContactDraftCustomerId(new URLSearchParams("paymentPeriod=monthly&plan=pro")), "gid://crater/Customer/new")
})

test("restores contact details and the payment stage repeatedly during checkout recovery", () => {
    saveCheckoutContactDraft({
        billingAddress,
        customerId: "gid://crater/Customer/1",
        email: "ada@example.com",
        emailSyncedToStripe: true,
        searchParams: new URLSearchParams("plan=pro&paymentPeriod=monthly&promotionCode=SAVE10"),
        stage: "payment",
    })

    const restored = readCheckoutContactDraft(new URLSearchParams("paymentPeriod=monthly&promotionCode=SAVE20&plan=pro"))
    assert.deepEqual(
        restored && { ...restored, expiresAt: 0 },
        {
            billingAddress,
            billingAddressComplete: true,
            configuration: "paymentPeriod=monthly&plan=pro",
            customerId: "gid://crater/Customer/1",
            email: "ada@example.com",
            emailComplete: true,
            emailSyncedToStripe: true,
            expiresAt: 0,
            stage: "payment",
        }
    )
    assert.ok(restored && restored.expiresAt > Date.now())
    assert.equal(readCheckoutContactDraft(new URLSearchParams("plan=pro&paymentPeriod=monthly"))?.email, "ada@example.com")
})

test("binds restored contact details to their checkout configuration", () => {
    saveCheckoutContactDraft({
        billingAddress,
        customerId: "gid://crater/Customer/1",
        email: "ada@example.com",
        searchParams: new URLSearchParams("plan=pro&paymentPeriod=monthly"),
        stage: "billingAddress",
    })

    assert.equal(readCheckoutContactDraft(new URLSearchParams("plan=pro&paymentPeriod=monthly"))?.customerId, "gid://crater/Customer/1")
    assert.equal(
        readCheckoutContactDraft(new URLSearchParams("plan=max&paymentPeriod=monthly")),
        null
    )
})

test("clears the contact draft together with the checkout draft keys", () => {
    saveCheckoutContactDraft({
        billingAddress,
        customerId: "gid://crater/Customer/1",
        email: "ada@example.com",
        searchParams: new URLSearchParams("plan=pro&paymentPeriod=monthly"),
        stage: "billingAddress",
    })

    clearCheckoutDraftKeys()

    assert.equal(
        readCheckoutContactDraft(new URLSearchParams("plan=pro&paymentPeriod=monthly")),
        null
    )
})
