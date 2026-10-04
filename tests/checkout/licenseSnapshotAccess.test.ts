import assert from "node:assert/strict"
import test from "node:test"
import { GET } from "../../src/app/api/crater/licenses/access/route"
import { createGraphQLTestServer } from "../helpers/graphqlTestServer"

const customerId = "gid://crater/Customer/3"
const snapshotId = "gid://crater/License/99"
const subscriptionId = "gid://crater/Subscription/7"
const end = { endCursor: null, hasNextPage: false }
const customers = { data: { currentUser: { customers: { edges: [{ cursor: "customer-3", node: { id: customerId } }], pageInfo: end } } } }
function subscriptionPage(id = subscriptionId, snapshots: string[] = [snapshotId], snapshotCursor: string | null = null, subscriptionCursor: string | null = null) {
    return {
        data: {
            currentUser: {
                customers: {
                    nodes: [
                        {
                            id: customerId,
                            subscriptions: {
                                nodes: [
                                    {
                                        id,
                                        currentLicense: { id: "gid://crater/License/100" },
                                        licenses: { nodes: snapshots.map((id) => ({ id })), pageInfo: { endCursor: snapshotCursor, hasNextPage: Boolean(snapshotCursor) } },
                                    },
                                ],
                                pageInfo: { endCursor: subscriptionCursor, hasNextPage: Boolean(subscriptionCursor) },
                            },
                        },
                    ],
                },
            },
        },
    }
}
function request(licenseId = snapshotId) {
    return new Request(`https://code0.example/api/crater/licenses/access?${new URLSearchParams({ locale: "de", customerId, licenseId })}`, {
        headers: { cookie: "crater_session=checkout-license-access" },
    })
}
async function withServer(responses: unknown[], run: (server: Awaited<ReturnType<typeof createGraphQLTestServer>>) => Promise<void>) {
    const server = await createGraphQLTestServer(responses)
    const previousUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = server.url
    try {
        await run(server)
    } finally {
        if (previousUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousUrl
        await server.close()
    }
}

test("opens the subscription detail belonging to the checkout snapshot", async () => {
    await withServer([customers, subscriptionPage()], async (server) => {
        const response = await GET(request())
        assert.equal(response.status, 307)
        assert.equal(response.headers.get("location"), "https://code0.example/de/licenses/customer/3/license/7")
        assert.equal(response.headers.get("cache-control"), "no-store")
        assert.ok(server.requests.every((entry) => entry.authorization === "Session checkout-license-access"))
        assert.doesNotMatch(response.headers.get("location")!, /checkout-license-access|license\/99/)
    })
})

test("resolves older snapshots after renewal across customer, subscription and snapshot pages", async () => {
    const otherCustomerPage = {
        data: { currentUser: { customers: { edges: [{ cursor: "customer-1", node: { id: "gid://crater/Customer/1" } }], pageInfo: { endCursor: "customer-1", hasNextPage: true } } } },
    }
    await withServer(
        [otherCustomerPage, customers, subscriptionPage("gid://crater/Subscription/6", [], null, "subscription-6"), subscriptionPage(subscriptionId, [], "snapshot-50"), subscriptionPage()],
        async (server) => {
            const response = await GET(request())
            assert.equal(response.headers.get("location"), "https://code0.example/de/licenses/customer/3/license/7")
            assert.deepEqual(
                server.requests.map((entry) => entry.body.variables),
                [
                    {},
                    { customerAfter: "customer-1" },
                    { customerAfter: "customer-1" },
                    { customerAfter: "customer-1", subscriptionAfter: "subscription-6" },
                    { customerAfter: "customer-1", subscriptionAfter: "subscription-6", snapshotAfter: "snapshot-50" },
                ]
            )
        }
    )
})

test("refuses snapshots outside the selected customer", async () => {
    await withServer([customers, subscriptionPage(subscriptionId, [])], async () => {
        const response = await GET(request())
        assert.equal(response.status, 404)
        assert.equal(response.headers.get("location"), null)
    })
})

test("stops repeated snapshot cursors instead of looping", async () => {
    await withServer([customers, subscriptionPage(subscriptionId, [], "repeated"), subscriptionPage(subscriptionId, [], "repeated")], async (server) => {
        assert.equal((await GET(request())).status, 502)
        assert.equal(server.requests.length, 3)
    })
})

test("requires snapshot identifiers instead of interpreting their numbers as subscription ids", async () => {
    assert.equal((await GET(request(subscriptionId))).status, 400)
})

test("clears an authenticated cookie when Crater no longer resolves its user", async () => {
    await withServer([{ data: { currentUser: null } }], async () => {
        const response = await GET(request())
        assert.equal(response.status, 401)
        assert.match(response.headers.get("set-cookie") ?? "", /crater_session=;/)
    })
})
