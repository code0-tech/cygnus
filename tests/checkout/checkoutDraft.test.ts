import assert from "node:assert/strict"
import test, { afterEach } from "node:test"
import { clearCheckoutDraftKeys, getCheckoutContactDraftCustomerId, saveCheckoutContactDraft, takeCheckoutContactDraft } from "../../src/lib/checkout/checkoutDraft"
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

test("restores contact details and the payment stage once after a promotion-code reload", () => {
    saveCheckoutContactDraft({
        billingAddress,
        customerId: "gid://crater/Customer/1",
        email: "ada@example.com",
        searchParams: new URLSearchParams("plan=pro&paymentPeriod=monthly&promotionCode=SAVE10"),
        stage: "payment",
    })

    assert.deepEqual(
        takeCheckoutContactDraft({
            customerId: "gid://crater/Customer/1",
            searchParams: new URLSearchParams("paymentPeriod=monthly&promotionCode=SAVE20&plan=pro"),
        }),
        { billingAddress, email: "ada@example.com", stage: "payment" }
    )
    assert.equal(
        takeCheckoutContactDraft({ customerId: "gid://crater/Customer/1", searchParams: new URLSearchParams("plan=pro&paymentPeriod=monthly") }),
        null
    )
})

test("does not restore contact details for another customer or checkout configuration", () => {
    saveCheckoutContactDraft({
        billingAddress,
        customerId: "gid://crater/Customer/1",
        email: "ada@example.com",
        searchParams: new URLSearchParams("plan=pro&paymentPeriod=monthly"),
        stage: "billingAddress",
    })

    assert.equal(
        takeCheckoutContactDraft({ customerId: "gid://crater/Customer/2", searchParams: new URLSearchParams("plan=pro&paymentPeriod=monthly") }),
        null
    )

    saveCheckoutContactDraft({
        billingAddress,
        customerId: "gid://crater/Customer/1",
        email: "ada@example.com",
        searchParams: new URLSearchParams("plan=pro&paymentPeriod=monthly"),
        stage: "billingAddress",
    })
    assert.equal(
        takeCheckoutContactDraft({ customerId: "gid://crater/Customer/1", searchParams: new URLSearchParams("plan=max&paymentPeriod=monthly") }),
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
        takeCheckoutContactDraft({ customerId: "gid://crater/Customer/1", searchParams: new URLSearchParams("plan=pro&paymentPeriod=monthly") }),
        null
    )
})
