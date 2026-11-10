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
const noUser = { data: { currentUser: null } }
const loggedOut = { data: { usersLogout: { errors: [] } } }
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

function entryRequest(params: Record<string, string>, cookie?: string, headers: Record<string, string> = {}) {
    return new Request(`https://0.0.0.0:3000/api/crater/licenses/access?${new URLSearchParams({ locale: "en", ...params })}`, { headers: { ...headers, ...(cookie ? { cookie } : {}) } })
}

// Only a navigation Sculptor opened may end the session to switch users; the browser sends Sculptor's origin as referrer.
const fromSculptor = { referer: "https://app.example/", "sec-fetch-site": "same-site" }

// Links never log a browser in: every login goes through /auth/start and returns to the same access request.
function assertStartsLogin(response: Response, accessParams: Record<string, string>) {
    assert.equal(response.status, 307)
    const location = new URL(response.headers.get("location") ?? "")
    assert.equal(`${location.origin}${location.pathname}`, "https://code0.example/api/crater/auth/start")
    assert.equal(location.searchParams.get("flow"), "licenses")
    assert.equal(location.searchParams.get("returnPath"), `/api/crater/licenses/access?${new URLSearchParams({ locale: "en", ...accessParams })}`)
    assert.doesNotMatch(response.headers.get("location") ?? "", /sagittarius-secret/)
    assert.ok(response.headers.getSetCookie().every((cookie) => /Max-Age=0/i.test(cookie)), "Must not set an authenticated session")
}

test("a Sculptor link without a Crater session starts the login without exchanging its token", async () => {
    await withGraphQLServer([], async (server) => {
        const response = await GET(entryRequest({ token: "sagittarius-secret", subscriptionId: "5", action: "upgrade" }))

        assertStartsLogin(response, { subscriptionId: "5", action: "upgrade" })
        assert.equal(response.headers.get("cache-control"), "no-store")
        assert.equal(response.headers.get("referrer-policy"), "no-referrer")
        assert.equal(server.requests.length, 0)
    })
})

test("the access request after the login opens the linked upgrade tab", async () => {
    await withGraphQLServer([ownedSubscription], async (server) => {
        const response = await GET(entryRequest({ subscriptionId: "5", action: "upgrade" }, "crater_session=linked-session"))

        assert.equal(response.headers.get("location"), "https://code0.example/en/licenses/customer/3/license/5/edit?tab=upgrade")
        assert.equal(server.requests[0].authorization, "Session linked-session")
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

test("an expired Crater session starts a fresh login instead of using the link token", async () => {
    await withGraphQLServer([noUser], async (server) => {
        const response = await GET(entryRequest({ token: "sagittarius-secret", subscriptionId: "5", action: "upgrade" }, "crater_session=expired-session"))

        assertStartsLogin(response, { subscriptionId: "5", action: "upgrade" })
        assert.equal(server.requests.length, 1)
        assert.ok(server.requests.every((entry) => !JSON.stringify(entry.body).includes("sagittarius-secret")))
    })
})

// code0-tech/cygnus#552: a link for another customer's subscription must not leave the old session in place.
test("a session that cannot see the linked subscription is signed out and replaced through the login", async () => {
    await withGraphQLServer([customerPage("gid://crater/Customer/1", ["gid://crater/Subscription/2"]), loggedOut], async (server) => {
        const response = await GET(entryRequest({ subscriptionId: "5", action: "upgrade" }, "crater_session=previous-session", fromSculptor))

        assertStartsLogin(response, { subscriptionId: "5", action: "upgrade", sessionSwitch: "1" })
        assert.match(response.headers.getSetCookie().join(";"), /crater_session=;/)
        assert.equal(server.requests.length, 2)
        assert.equal(server.requests[1].body.operationName, "CraterSessionLogout")
        assert.ok(server.requests.every((entry) => entry.authorization === "Session previous-session"))
        assert.ok(server.requests.every((entry) => !JSON.stringify(entry.body).includes("sagittarius-secret")))
    })
})

test("the new session opens the linked subscription after switching", async () => {
    await withGraphQLServer([ownedSubscription], async (server) => {
        const response = await GET(entryRequest({ subscriptionId: "5", action: "upgrade", sessionSwitch: "1" }, "crater_session=switched-session"))

        assert.equal(response.headers.get("location"), "https://code0.example/en/licenses/customer/3/license/5/edit?tab=upgrade")
        assert.equal(server.requests.length, 1)
    })
})

test("a subscription the switched session cannot see either opens the dashboard without another login", async () => {
    await withGraphQLServer([customerPage("gid://crater/Customer/1", [])], async (server) => {
        const response = await GET(entryRequest({ subscriptionId: "9", action: "upgrade", sessionSwitch: "1" }, "crater_session=switched-session"))

        assert.equal(response.headers.get("location"), "https://code0.example/en/licenses")
        assert.equal(response.headers.getSetCookie().length, 0)
        assert.equal(server.requests.length, 1)
    })
})

test("a failed logout still drops the local session and starts the login", async () => {
    const rejectedLogout = { data: { usersLogout: { errors: [{ errorCode: "MISSING_PERMISSION", details: [] }] } } }
    await withGraphQLServer([customerPage("gid://crater/Customer/1", []), rejectedLogout], async () => {
        const response = await GET(entryRequest({ subscriptionId: "9" }, "crater_session=previous-session", fromSculptor))

        assertStartsLogin(response, { subscriptionId: "9", sessionSwitch: "1" })
        assert.match(response.headers.getSetCookie().join(";"), /crater_session=;/)
    })
})
