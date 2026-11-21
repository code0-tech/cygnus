import assert from "node:assert/strict"
import test, { afterEach } from "node:test"
import { getCheckoutCustomers } from "../../src/lib/checkout/client"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"

installDomTestEnvironment()

const originalFetch = globalThis.fetch

afterEach(() => {
    globalThis.fetch = originalFetch
})

test("loads the user's customer in a single request", async () => {
    const requests: string[] = []
    globalThis.fetch = (async (input) => {
        requests.push(String(input))
        return new Response(JSON.stringify({ customers: [{ customerType: "business", id: "gid://crater/Customer/1" }] }), {
            status: 200,
            headers: { "content-type": "application/json" },
        })
    }) as typeof fetch

    const customers = await getCheckoutCustomers()

    assert.deepEqual(requests, ["/api/crater/customer"])
    assert.deepEqual(
        customers.map((customer) => customer.id),
        ["gid://crater/Customer/1"]
    )
})

test("a user without a customer gets an empty list", async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify({ customers: [] }), { status: 200, headers: { "content-type": "application/json" } })) as typeof fetch

    assert.deepEqual(await getCheckoutCustomers(), [])
})

test("needs no request when the checkout bootstrap already delivered the customer", async () => {
    let requests = 0
    globalThis.fetch = (async () => {
        requests += 1
        return new Response("{}", { status: 500 })
    }) as typeof fetch

    const customers = await getCheckoutCustomers([{ customerType: "personal", email: null, id: "gid://crater/Customer/1", name: null }])

    assert.equal(requests, 0)
    assert.deepEqual(
        customers.map((customer) => customer.id),
        ["gid://crater/Customer/1"]
    )
})
