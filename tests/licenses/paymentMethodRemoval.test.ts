import assert from "node:assert/strict"
import test, { mock } from "node:test"
import { removeLicenseCustomerPaymentMethod } from "../../src/lib/licenses/client"

test("payment method removal sends only the chosen ID and preserves domain error codes", async () => {
    const requests: unknown[] = []
    const responses = [new Response(null, { status: 200 }), Response.json({ errorCode: "PAYMENT_METHOD_IN_USE" }, { status: 422 })]
    const fetchMock = mock.method(globalThis, "fetch", async (url: unknown, init?: RequestInit) => {
        assert.equal(url, "/api/crater/customer")
        assert.equal(init?.method, "PATCH")
        assert.equal(init?.credentials, "same-origin")
        requests.push(JSON.parse(String(init?.body)))
        return responses.shift()!
    })
    try {
        assert.equal(await removeLicenseCustomerPaymentMethod("customer-1", "pm_remove"), undefined)
        assert.equal(await removeLicenseCustomerPaymentMethod("customer-1", "pm_remove"), "PAYMENT_METHOD_IN_USE")
        assert.deepEqual(requests, [
            { id: "customer-1", removePaymentMethodId: "pm_remove" },
            { id: "customer-1", removePaymentMethodId: "pm_remove" },
        ])
    } finally {
        fetchMock.mock.restore()
    }
})
