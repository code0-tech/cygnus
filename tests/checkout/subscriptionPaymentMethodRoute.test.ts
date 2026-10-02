import assert from "node:assert/strict"
import test from "node:test"
import { GET } from "../../src/app/api/crater/subscriptions/payment-method/route"
import { createGraphQLTestServer } from "./graphqlTestServer"

function page(customerId: number, subscriptions: Array<{ id: string; paymentMethodId: string | null }>, customerCursor: string | null = null, subscriptionCursor: string | null = null) {
    return { data: { currentUser: { customers: {
        nodes: [{ id: `gid://crater/Customer/${customerId}`, subscriptions: {
            nodes: subscriptions,
            pageInfo: { endCursor: subscriptionCursor, hasNextPage: Boolean(subscriptionCursor) },
        } }],
        pageInfo: { endCursor: customerCursor, hasNextPage: Boolean(customerCursor) },
    } } } }
}
const target = "gid://crater/Subscription/2"
async function withServer(responses: unknown[], check: (server: Awaited<ReturnType<typeof createGraphQLTestServer>>) => Promise<void>) {
    const server = await createGraphQLTestServer(responses)
    const previousUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = server.url
    try { await check(server) } finally {
        if (previousUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousUrl
        await server.close()
    }
}
function request() {
    return new Request(`https://example.com/api/crater/subscriptions/payment-method?subscriptionId=${encodeURIComponent(target)}`, { headers: { authorization: "Session payment-summary-test" } })
}

test("walks subscription and customer pages before resolving the selected payment method", async () => {
    const summary = { brand: "visa", last4: "4242", type: "card", expiresMonth: 12, expiresYear: 2030 }
    await withServer([
        page(1, [], "customer-1", "subscription-1"),
        page(1, [], "customer-1"),
        page(2, [], null, "subscription-2"),
        page(2, [{ id: target, paymentMethodId: "pm_selected" }]),
        { data: { paymentMethod: summary } },
    ], async (server) => {
        const response = await GET(request())
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { paymentMethod: summary })
        assert.deepEqual(server.requests.map((entry) => entry.body.variables), [
            {}, { subscriptionAfter: "subscription-1" }, { customerAfter: "customer-1" },
            { customerAfter: "customer-1", subscriptionAfter: "subscription-2" }, { paymentMethodId: "pm_selected" },
        ])
        assert.ok(server.requests.every((entry) => entry.authorization === "Session payment-summary-test"))
    })
})

test("returns null without a summary query when the subscription has no default", async () => {
    await withServer([page(1, [{ id: target, paymentMethodId: null }])], async (server) => {
        const response = await GET(request())
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { paymentMethod: null })
        assert.equal(server.requests.length, 1)
    })
})

test("returns 404 for subscriptions outside the authenticated user's connections", async () => {
    await withServer([page(1, [])], async (server) => {
        assert.equal((await GET(request())).status, 404)
        assert.equal(server.requests.length, 1)
    })
})

test("refuses a repeated subscription cursor instead of looping", async () => {
    await withServer([page(1, [], null, "repeated"), page(1, [], null, "repeated")], async (server) => {
        assert.equal((await GET(request())).status, 502)
        assert.equal(server.requests.length, 2)
    })
})
