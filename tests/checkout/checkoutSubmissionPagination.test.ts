import assert from "node:assert/strict"
import test, { afterEach } from "node:test"
import { getCheckoutCustomers } from "../../src/lib/checkout/client"
import { installDomTestEnvironment } from "../helpers/domTestEnvironment"

installDomTestEnvironment()

const originalFetch = globalThis.fetch

afterEach(() => {
    globalThis.fetch = originalFetch
})

test("loads every checkout customer cursor page", async () => {
    const requests: string[] = []
    globalThis.fetch = (async (input) => {
        const url = String(input)
        requests.push(url)
        const secondPage = url.includes("after=customer-50")
        return new Response(
            JSON.stringify({
                customers: [{ customerType: secondPage ? "business" : "personal", id: `gid://crater/Customer/${secondPage ? 51 : 1}` }],
                pageInfo: { endCursor: secondPage ? null : "customer-50", hasNextPage: !secondPage },
            }),
            { status: 200, headers: { "content-type": "application/json" } }
        )
    }) as typeof fetch

    const customers = await getCheckoutCustomers()

    assert.deepEqual(requests, ["/api/crater/customer", "/api/crater/customer?after=customer-50"])
    assert.deepEqual(
        customers.map((customer) => customer.id),
        ["gid://crater/Customer/1", "gid://crater/Customer/51"]
    )
})

test("continues after the customer page the checkout bootstrap already delivered", async () => {
    const requests: string[] = []
    globalThis.fetch = (async (input) => {
        requests.push(String(input))
        return new Response(JSON.stringify({ customers: [{ customerType: "business", id: "gid://crater/Customer/51" }], pageInfo: { endCursor: null, hasNextPage: false } }), {
            status: 200,
            headers: { "content-type": "application/json" },
        })
    }) as typeof fetch

    const customers = await getCheckoutCustomers({
        customers: [{ customerType: "personal", email: null, id: "gid://crater/Customer/1", name: null }],
        endCursor: "customer-50",
        hasNextPage: true,
    })

    assert.deepEqual(requests, ["/api/crater/customer?after=customer-50"])
    assert.deepEqual(
        customers.map((customer) => customer.id),
        ["gid://crater/Customer/1", "gid://crater/Customer/51"]
    )
})

test("needs no further request when the bootstrap page is the only one", async () => {
    let requests = 0
    globalThis.fetch = (async () => {
        requests += 1
        return new Response("{}", { status: 500 })
    }) as typeof fetch

    const customers = await getCheckoutCustomers({ customers: [{ customerType: "personal", email: null, id: "gid://crater/Customer/1", name: null }], endCursor: null, hasNextPage: false })

    assert.equal(requests, 0)
    assert.deepEqual(
        customers.map((customer) => customer.id),
        ["gid://crater/Customer/1"]
    )
})
