import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import test from "node:test"
import { withGraphQLServer } from "../helpers/graphqlTestServer"

const serverOnlyHook = registerHooks({
    resolve(specifier, context, nextResolve) {
        return nextResolve(specifier === "server-only" ? "next/dist/compiled/server-only/empty.js" : specifier, context)
    },
})
const { GET } = await import("../../src/app/api/crater/licenses/access/route")
serverOnlyHook.deregister()

const previousServerUrl = process.env.SERVER_URL
test.before(() => {
    process.env.SERVER_URL = "https://code0.example"
})
test.after(() => {
    if (previousServerUrl === undefined) delete process.env.SERVER_URL
    else process.env.SERVER_URL = previousServerUrl
})

const customerId = "gid://crater/Customer/3"
const snapshotId = "gid://crater/License/99"
const subscriptionId = "gid://crater/Subscription/7"
function subscriptionPage(id = subscriptionId, snapshots: string[] = [snapshotId], snapshotCursor: string | null = null, subscriptionCursor: string | null = null, owner = customerId) {
    return {
        data: {
            currentUser: {
                customer: {
                    id: owner,
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
            },
        },
    }
}
function request(licenseId = snapshotId) {
    return new Request(`https://code0.example/api/crater/licenses/access?${new URLSearchParams({ locale: "de", customerId, licenseId })}`, {
        headers: { cookie: "crater_session=checkout-license-access" },
    })
}

test("opens the subscription detail belonging to the checkout snapshot", async () => {
    await withGraphQLServer([subscriptionPage()], async (server) => {
        const response = await GET(request())
        assert.equal(response.status, 307)
        assert.equal(response.headers.get("location"), "https://code0.example/de/licenses/customer/3/license/7")
        assert.equal(response.headers.get("cache-control"), "no-store")
        assert.ok(server.requests.every((entry) => entry.authorization === "Session checkout-license-access"))
        assert.doesNotMatch(response.headers.get("location")!, /checkout-license-access|license\/99/)
    })
})

test("resolves older snapshots after renewal across subscription and snapshot pages", async () => {
    await withGraphQLServer(
        [subscriptionPage("gid://crater/Subscription/6", [], null, "subscription-6"), subscriptionPage(subscriptionId, [], "snapshot-50"), subscriptionPage()],
        async (server) => {
            const response = await GET(request())
            assert.equal(response.headers.get("location"), "https://code0.example/de/licenses/customer/3/license/7")
            assert.deepEqual(
                server.requests.map((entry) => entry.body.variables),
                [{}, { subscriptionAfter: "subscription-6" }, { subscriptionAfter: "subscription-6", snapshotAfter: "snapshot-50" }]
            )
        }
    )
})

test("refuses snapshots outside the selected customer", async () => {
    await withGraphQLServer([subscriptionPage(subscriptionId, [])], async () => {
        const response = await GET(request())
        assert.equal(response.status, 404)
        assert.equal(response.headers.get("location"), null)
    })
})

test("refuses a customer id that is not the user's own customer", async () => {
    await withGraphQLServer([subscriptionPage(subscriptionId, [snapshotId], null, null, "gid://crater/Customer/4")], async (server) => {
        const response = await GET(request())
        assert.equal(response.status, 404)
        assert.equal(server.requests.length, 1)
    })
})

test("stops repeated snapshot cursors instead of looping", async () => {
    await withGraphQLServer([subscriptionPage(subscriptionId, [], "repeated"), subscriptionPage(subscriptionId, [], "repeated")], async (server) => {
        assert.equal((await GET(request())).status, 502)
        assert.equal(server.requests.length, 2)
    })
})

test("requires snapshot identifiers instead of interpreting their numbers as subscription ids", async () => {
    assert.equal((await GET(request(subscriptionId))).status, 400)
})

test("clears an authenticated cookie when Crater no longer resolves its user", async () => {
    await withGraphQLServer([{ data: { currentUser: null } }], async () => {
        const response = await GET(request())
        assert.equal(response.status, 401)
        assert.match(response.headers.get("set-cookie") ?? "", /crater_session=;/)
    })
})
