import assert from "node:assert/strict"
import test, { type TestContext } from "node:test"
import { GET as login } from "../../src/app/api/crater/auth/callback/route"
import { GET as namespace } from "../../src/app/api/crater/licenses/namespace/callback/route"
import { withGraphQLServer } from "../helpers/graphqlTestServer"

const state = "s".repeat(43)
const loginResult = { data: { usersLogin: { errors: [], userSession: { id: "gid://crater/UserSession/9", token: "new-session" } } } }
const linkResult = { data: { subscriptionsLinkNamespace: { errors: [], subscription: { id: "gid://crater/Subscription/9" } } } }
const logoutResult = { data: { usersLogout: { errors: [] } } }
const routes = [
    { name: "login", handler: login, path: "/api/crater/auth/callback", results: [loginResult], operations: ["UsersLogin"] },
    { name: "namespace", handler: namespace, path: "/api/crater/licenses/namespace/callback", results: [loginResult, linkResult], operations: ["UsersLogin", "SubscriptionsLinkNamespace"] },
]

function environment(t: TestContext, max = "100") {
    for (const [key, value] of Object.entries({ SERVER_URL: "https://code0.example", CRATER_LOGIN_RATE_LIMIT_MAX: max, CRATER_RATE_LIMIT_TRUSTED_PROXY_HOPS: "1" })) {
        const previous = process.env[key]
        process.env[key] = value
        t.after(() => {
            if (previous === undefined) delete process.env[key]
            else process.env[key] = previous
        })
    }
}

let address = 0
function callbackRequest(path: string, oldSession?: string, ip = `198.51.100.${++address}`, requestState = state) {
    const url = new URL(path, "https://code0.example")
    url.search = new URLSearchParams({ returnPath: "/en/licenses/customer/3/license/9", namespace: "gid://sagittarius/Namespace/9", token: "sagittarius-token", state: requestState }).toString()
    return new Request(url, { headers: { cookie: `crater_login_state=${state}${oldSession ? `; crater_session=${oldSession}` : ""}`, "x-forwarded-for": ip } })
}

for (const route of routes) {
    test(`${route.name} callback revokes the old session before replacing its cookie`, async (t) => {
        environment(t)
        await withGraphQLServer([...route.results, logoutResult], async (server) => {
            const response = await route.handler(callbackRequest(route.path, "old-session"))
            assert.equal(response.status, 307)
            assert.ok(response.headers.getSetCookie().some(cookie => cookie.startsWith("crater_session=new-session;")))
            assert.deepEqual(server.requests.map(request => request.body.operationName), [...route.operations, "CraterSessionLogout"])
            assert.equal(server.requests.at(-1)?.authorization, "Session old-session")
            assert.deepEqual(server.requests.at(-1)?.body.variables, { input: {} })
        })
    })

    test(`${route.name} callback does not revoke a session when login fails`, async (t) => {
        environment(t)
        await withGraphQLServer([{ data: { usersLogin: { errors: [{ errorCode: "INVALID_SAGITTARIUS_TOKEN" }], userSession: null } } }], async (server) => {
            const response = await route.handler(callbackRequest(route.path, "old-session"))
            assert.equal(response.status, 307)
            assert.ok(!response.headers.getSetCookie().some(cookie => cookie.startsWith("crater_session=")))
            assert.deepEqual(server.requests.map(request => request.body.operationName), ["UsersLogin"])
        })
    })

    test(`${route.name} callback skips revocation when there is no previous session or the token is unchanged`, async (t) => {
        environment(t)
        for (const oldSession of [undefined, "new-session"]) {
            await withGraphQLServer([...route.results], async (server) => {
                const response = await route.handler(callbackRequest(route.path, oldSession))
                assert.ok(response.headers.getSetCookie().some(cookie => cookie.startsWith("crater_session=new-session;")))
                assert.deepEqual(server.requests.map(request => request.body.operationName), route.operations)
            })
        }
    })

    test(`${route.name} callback still allows login when the old session can no longer be revoked`, async (t) => {
        environment(t)
        await withGraphQLServer([...route.results, { errors: [{ message: "Unauthorized" }] }], async (server) => {
            const response = await route.handler(callbackRequest(route.path, "expired-session"))
            assert.ok(response.headers.getSetCookie().some(cookie => cookie.startsWith("crater_session=new-session;")))
            assert.equal(server.requests.at(-1)?.authorization, "Session expired-session")
        })
    })

    test(`${route.name} callback rate limits login before contacting Crater or revoking sessions`, async (t) => {
        environment(t, "1")
        const ip = `203.0.113.${++address}`
        await withGraphQLServer([...route.results], async (server) => {
            // Invalid state must neither reach Crater nor consume another browser's budget.
            assert.equal((await route.handler(callbackRequest(route.path, "old-session", ip, "invalid"))).status, 307)
            assert.equal(server.requests.length, 0)
            assert.equal((await route.handler(callbackRequest(route.path, undefined, ip))).status, 307)
            const response = await route.handler(callbackRequest(route.path, "old-session", ip))
            assert.equal(response.status, 429)
            assert.ok(Number(response.headers.get("retry-after")) > 0)
            assert.equal(response.headers.get("cache-control"), "no-store")
            assert.ok(response.headers.getSetCookie().some(cookie => cookie.startsWith("crater_login_state=;") && /Max-Age=0/i.test(cookie)))
            assert.ok(!response.headers.getSetCookie().some(cookie => cookie.startsWith("crater_session=")))
            assert.equal(server.requests.length, route.results.length)
        })
    })
}

test("namespace callback also revokes the old session when namespace linking is rejected", async (t) => {
    environment(t)
    await withGraphQLServer([loginResult, { data: { subscriptionsLinkNamespace: { errors: [{ errorCode: "INVALID_SUBSCRIPTION" }], subscription: null } } }, logoutResult], async (server) => {
        const response = await namespace(callbackRequest(routes[1].path, "old-session"))
        assert.equal(new URL(response.headers.get("location")!).searchParams.get("namespaceError"), "update")
        assert.ok(response.headers.getSetCookie().some(cookie => cookie.startsWith("crater_session=new-session;")))
        assert.equal(server.requests.at(-1)?.authorization, "Session old-session")
        assert.equal(server.requests.at(-1)?.body.operationName, "CraterSessionLogout")
    })
})
