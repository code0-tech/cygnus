import assert from "node:assert/strict"
import test from "node:test"
import { GET } from "../../src/app/api/crater/licenses/access/route"
import { withGraphQLServer } from "../helpers/graphqlTestServer"

const previousServerUrl = process.env.SERVER_URL
const previousSculptorLoginUrl = process.env.SCULPTOR_LOGIN_URL
test.before(() => {
    process.env.SERVER_URL = "https://code0.example"
    process.env.SCULPTOR_LOGIN_URL = "https://app.example/login"
})
test.after(() => {
    if (previousServerUrl === undefined) delete process.env.SERVER_URL
    else process.env.SERVER_URL = previousServerUrl
    if (previousSculptorLoginUrl === undefined) delete process.env.SCULPTOR_LOGIN_URL
    else process.env.SCULPTOR_LOGIN_URL = previousSculptorLoginUrl
})

const end = { endCursor: null, hasNextPage: false }
const login = (token = "linked-session") => ({
    data: {
        usersLogin: {
            errors: [],
            userSession: { active: true, createdAt: "2026-10-16T10:00:00Z", id: "gid://crater/UserSession/1", token, updatedAt: "2026-10-16T10:00:00Z" },
        },
    },
})
const rejectedLogin = { data: { usersLogin: { errors: [{ errorCode: "INVALID_SAGITTARIUS_TOKEN", details: [] }], userSession: null } } }
const noUser = { data: { currentUser: null } }
function customerPage(customerId: string, subscriptionIds: string[], customerCursor: string | null = null) {
    return {
        data: {
            currentUser: {
                customers: {
                    nodes: [{ id: customerId, subscriptions: { nodes: subscriptionIds.map((id) => ({ id })), pageInfo: end } }],
                    pageInfo: { endCursor: customerCursor, hasNextPage: Boolean(customerCursor) },
                },
            },
        },
    }
}
const ownedSubscription = customerPage("gid://crater/Customer/3", ["gid://crater/Subscription/5"])

function entryRequest(params: Record<string, string>, cookie?: string) {
    return new Request(`https://0.0.0.0:3000/api/crater/licenses/access?${new URLSearchParams({ locale: "en", ...params })}`, cookie ? { headers: { cookie } } : {})
}

test("a Sculptor link without a Crater session logs in with its token and opens the upgrade tab", async () => {
    await withGraphQLServer([login(), ownedSubscription], async (server) => {
        const response = await GET(entryRequest({ token: "sagittarius-secret", subscriptionId: "5", action: "upgrade" }))

        assert.equal(response.status, 307)
        assert.equal(response.headers.get("location"), "https://code0.example/en/licenses/customer/3/license/5/edit?tab=upgrade")
        assert.equal(response.headers.get("cache-control"), "no-store")
        assert.equal(response.headers.get("referrer-policy"), "no-referrer")
        const sessionCookie = response.headers.getSetCookie().find((cookie) => cookie.startsWith("crater_session=")) ?? ""
        assert.match(sessionCookie, /crater_session=linked-session/)
        assert.match(sessionCookie, /HttpOnly/i)
        assert.deepEqual(server.requests[0].body.variables, { input: { sagittariusToken: "sagittarius-secret" } })
        assert.equal(server.requests[0].authorization, undefined)
        assert.equal(server.requests[1].authorization, "Session linked-session")
    })
})

test("license and customer actions open the general tab of their dialog", async () => {
    for (const [action, location] of [
        ["license", "https://code0.example/en/licenses/customer/3/license/5/edit?tab=general"],
        ["customer", "https://code0.example/en/licenses/customer/3/edit?tab=general"],
        ["unknown", "https://code0.example/en/licenses/customer/3/license/5"],
    ]) {
        await withGraphQLServer([ownedSubscription], async () => {
            const response = await GET(entryRequest({ subscriptionId: "5", action }, "crater_session=existing-session"))
            assert.equal(response.headers.get("location"), location)
        })
    }
})

test("an existing Crater session is reused and the link token is not exchanged", async () => {
    const otherCustomer = customerPage("gid://crater/Customer/1", ["gid://crater/Subscription/2"], "customer-1")
    await withGraphQLServer([otherCustomer, ownedSubscription], async (server) => {
        const response = await GET(entryRequest({ token: "sagittarius-secret", subscriptionId: "5", action: "license" }, "crater_session=existing-session"))

        assert.equal(response.headers.get("location"), "https://code0.example/en/licenses/customer/3/license/5/edit?tab=general")
        assert.ok(server.requests.every((entry) => entry.authorization === "Session existing-session"))
        assert.ok(server.requests.every((entry) => !JSON.stringify(entry.body).includes("sagittarius-secret")))
        assert.deepEqual(server.requests[1].body.variables, { customerAfter: "customer-1" })
        assert.equal(response.headers.getSetCookie().length, 0)
    })
})

test("an expired Crater session falls back to the link token", async () => {
    await withGraphQLServer([noUser, login("fresh-session"), ownedSubscription], async (server) => {
        const response = await GET(entryRequest({ token: "sagittarius-secret", subscriptionId: "5", action: "upgrade" }, "crater_session=expired-session"))

        assert.equal(response.headers.get("location"), "https://code0.example/en/licenses/customer/3/license/5/edit?tab=upgrade")
        assert.match(response.headers.getSetCookie().join(";"), /crater_session=fresh-session/)
        assert.equal(server.requests[2].authorization, "Session fresh-session")
    })
})

test("a rejected link token starts the Sculptor login without forwarding the token", async () => {
    await withGraphQLServer([rejectedLogin], async () => {
        const response = await GET(entryRequest({ token: "sagittarius-secret", subscriptionId: "5", action: "customer" }))

        const location = new URL(response.headers.get("location") ?? "")
        assert.equal(`${location.origin}${location.pathname}`, "https://code0.example/api/crater/auth/start")
        assert.equal(location.searchParams.get("returnPath"), `/api/crater/licenses/access?${new URLSearchParams({ locale: "en", subscriptionId: "5", action: "customer" })}`)
        assert.doesNotMatch(response.headers.get("location") ?? "", /sagittarius-secret/)
        assert.equal(response.headers.getSetCookie().some((cookie) => cookie.startsWith("crater_session=") && !cookie.startsWith("crater_session=;")), false)
    })
})

test("a subscription the user cannot see still opens the dashboard", async () => {
    await withGraphQLServer([login(), customerPage("gid://crater/Customer/1", [])], async () => {
        const response = await GET(entryRequest({ token: "sagittarius-secret", subscriptionId: "9", action: "upgrade" }))

        assert.equal(response.headers.get("location"), "https://code0.example/en/licenses")
        assert.match(response.headers.getSetCookie().join(";"), /crater_session=linked-session/)
    })
})
