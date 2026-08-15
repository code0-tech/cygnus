import assert from "node:assert/strict"
import test, { afterEach } from "node:test"
import { getCheckoutCustomers } from "../../src/lib/checkout/checkoutSubmission"
import { installDomTestEnvironment } from "./domTestEnvironment"

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
