import assert from "node:assert/strict"
import test, { afterEach, beforeEach, mock } from "node:test"
import { logoutLicenseSession } from "../../src/lib/licenses/client"
import { saveCheckoutContactDraft } from "../../src/lib/checkout/checkoutDraft"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"

installDomTestEnvironment()

beforeEach(() => {
    for (const searchParams of [new URLSearchParams(), new URLSearchParams({ guestCheckout: "purchase-one" })]) {
        saveCheckoutContactDraft({
            billingAddress: { name: "Example Customer", address: { line1: "Main Street 1", city: "Berlin", postal_code: "10115", country: "DE" } },
            customerId: "gid://crater/Customer/1",
            email: "customer@example.com",
            searchParams,
            stage: "payment",
        })
    }
    for (const storage of [window.localStorage, window.sessionStorage]) {
        assert.ok(storage.getItem("code0.checkout.contactDraft"))
        storage.setItem("unrelated-preference", "keep")
    }
})

afterEach(() => {
    for (const storage of [window.localStorage, window.sessionStorage]) {
        assert.equal(storage.getItem("code0.checkout.contactDraft"), null)
        assert.equal(storage.getItem("unrelated-preference"), "keep")
        storage.clear()
    }
})

test("successful logout removes account and guest checkout contact drafts", async () => {
    const fetchMock = mock.method(globalThis, "fetch", async () => Response.json({ authenticated: false }))
    try {
        await logoutLicenseSession()
    } finally {
        fetchMock.mock.restore()
    }
})

test("logout accepts confirmed local logout when Crater revocation failed", async () => {
    const fetchMock = mock.method(globalThis, "fetch", async (url: unknown, init?: RequestInit) => {
        assert.equal(url, "/api/crater/auth/session")
        assert.equal(init?.method, "DELETE")
        assert.equal(init?.credentials, "same-origin")
        return Response.json({ authenticated: false, errorCode: "MISSING_PERMISSION" }, { status: 422 })
    })
    try {
        await assert.doesNotReject(logoutLicenseSession)
    } finally {
        fetchMock.mock.restore()
    }
})

test("logout still fails when the server has not confirmed local logout", async () => {
    const fetchMock = mock.method(globalThis, "fetch", async () => Response.json({ error: "Proxy unavailable" }, { status: 502 }))
    try {
        await assert.rejects(logoutLicenseSession, /Could not log out/)
        fetchMock.mock.mockImplementation(async () => { throw new TypeError("Network unavailable") })
        await assert.rejects(logoutLicenseSession, /Network unavailable/)
    } finally {
        fetchMock.mock.restore()
    }
})
