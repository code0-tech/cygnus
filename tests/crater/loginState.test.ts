import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import test, { afterEach, beforeEach } from "node:test"
import { createGraphQLTestServer } from "../helpers/graphqlTestServer"

const serverOnlyHook = registerHooks({
    resolve(specifier, context, nextResolve) {
        return nextResolve(specifier === "server-only" ? "next/dist/compiled/server-only/empty.js" : specifier, context)
    },
})
const { GET: startCraterLogin } = await import("../../src/app/api/crater/auth/start/route")
const { GET: completeCraterLogin } = await import("../../src/app/api/crater/auth/callback/route")
const { GET: selectLicenseNamespace } = await import("../../src/app/api/crater/licenses/namespace/callback/route")
serverOnlyHook.deregister()

const environmentKeys = ["CRATER_GRAPHQL_URL", "SCULPTOR_LOGIN_URL", "SERVER_URL"] as const
let previousEnvironment: Partial<Record<(typeof environmentKeys)[number], string>> = {}

beforeEach(() => {
    previousEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]))
    process.env.SCULPTOR_LOGIN_URL = "https://sculptor.example/login"
    process.env.SERVER_URL = "https://code0.example"
})

afterEach(() => {
    for (const key of environmentKeys) {
        if (previousEnvironment[key] === undefined) delete process.env[key]
        else process.env[key] = previousEnvironment[key]
    }
})

function loginStateCookie(response: Response) {
    return response.headers.getSetCookie().find((cookie) => cookie.startsWith("crater_login_state=")) ?? ""
}

function sessionCookies(response: Response) {
    return response.headers.getSetCookie().filter((cookie) => cookie.startsWith("crater_session=") || cookie.startsWith("crater_user_login="))
}

test("starts a checkout login with a state bound to an HttpOnly cookie", async () => {
    const returnPath = "/de/checkout?plan=pro&deploymentType=cloud"
    const response = await startCraterLogin(
        new Request(`https://0.0.0.0:3000/api/crater/auth/start?${new URLSearchParams({ flow: "checkout", returnPath, cancelUrl: "https://code0.example/de/subscription?plan=pro" })}`)
    )

    assert.equal(response.status, 307)
    assert.equal(response.headers.get("cache-control"), "no-store")
    const location = new URL(response.headers.get("location") ?? "")
    assert.equal(`${location.origin}${location.pathname}`, "https://sculptor.example/login")
    assert.equal(location.searchParams.get("cancelUrl"), "https://code0.example/de/subscription?plan=pro")
    assert.equal(location.searchParams.get("selectNamespace"), "true")

    const callbackUrl = new URL(location.searchParams.get("callbackUrl") ?? "")
    assert.equal(`${callbackUrl.origin}${callbackUrl.pathname}`, "https://code0.example/api/crater/auth/callback")
    assert.equal(callbackUrl.searchParams.get("returnPath"), returnPath)

    const cookie = loginStateCookie(response)
    const state = callbackUrl.searchParams.get("state")
    assert.match(state ?? "", /^[A-Za-z0-9_-]{43}$/)
    assert.match(cookie, new RegExp(`^crater_login_state=${state};`))
    assert.match(cookie, /HttpOnly/i)
    assert.match(cookie, /Path=\/api\/crater/i)
    assert.match(cookie, /SameSite=lax/i)
    assert.match(cookie, /Max-Age=600/i)
})

test("issues a fresh state for every login start", async () => {
    const start = () => startCraterLogin(new Request(`https://0.0.0.0:3000/api/crater/auth/start?${new URLSearchParams({ flow: "checkout", returnPath: "/en/checkout?plan=pro" })}`))
    const [first, second] = await Promise.all([start(), start()])

    assert.notEqual(loginStateCookie(first), loginStateCookie(second))
})

test("starts a namespace selection login for an exact license route", async () => {
    const returnPath = "/en/licenses/customer/3/license/9/edit"
    const response = await startCraterLogin(new Request(`https://0.0.0.0:3000/api/crater/auth/start?${new URLSearchParams({ flow: "namespace", returnPath })}`))

    const location = new URL(response.headers.get("location") ?? "")
    const callbackUrl = new URL(location.searchParams.get("callbackUrl") ?? "")
    assert.equal(`${callbackUrl.origin}${callbackUrl.pathname}`, "https://code0.example/api/crater/licenses/namespace/callback")
    assert.equal(callbackUrl.searchParams.get("returnPath"), returnPath)
    assert.equal(location.searchParams.get("cancelUrl"), `https://code0.example${returnPath}`)
    assert.equal(location.searchParams.get("selectNamespace"), "true")
    assert.match(loginStateCookie(response), new RegExp(`^crater_login_state=${callbackUrl.searchParams.get("state")};`))
})

test("refuses to start a login for foreign return or cancel targets", async () => {
    for (const params of [
        { flow: "checkout", returnPath: "https://evil.example/de/checkout" },
        { flow: "checkout", returnPath: "//evil.example/de/checkout" },
        { flow: "namespace", returnPath: "/en/licenses" },
        { flow: "unknown", returnPath: "/en/checkout" },
    ]) {
        const response = await startCraterLogin(new Request(`https://0.0.0.0:3000/api/crater/auth/start?${new URLSearchParams(params)}`))

        assert.equal(response.headers.get("location"), "https://code0.example/")
        assert.equal(loginStateCookie(response), "")
    }

    const foreignCancel = await startCraterLogin(
        new Request(`https://0.0.0.0:3000/api/crater/auth/start?${new URLSearchParams({ flow: "checkout", returnPath: "/de/checkout?plan=pro", cancelUrl: "https://evil.example/" })}`)
    )
    assert.equal(new URL(foreignCancel.headers.get("location") ?? "").searchParams.get("cancelUrl"), "https://code0.example/de/subscription")
})

test("login callback ignores a token without a matching login state", async () => {
    const graphQLServer = await createGraphQLTestServer([])
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url
    const callback = "https://0.0.0.0:3000/api/crater/auth/callback?returnPath=%2Fde%2Fcheckout%3Fplan%3Dpro&token=attacker-token"
    const validState = "s".repeat(43)

    try {
        for (const request of [
            new Request(callback),
            new Request(`${callback}&state=${validState}`),
            new Request(callback, { headers: { cookie: `crater_login_state=${validState}` } }),
            new Request(`${callback}&state=${"x".repeat(43)}`, { headers: { cookie: `crater_login_state=${validState}` } }),
        ]) {
            const response = await completeCraterLogin(request)

            assert.equal(response.headers.get("location"), "https://code0.example/de/checkout?plan=pro&authError=session")
            assert.deepEqual(sessionCookies(response), [])
        }
        assert.equal(graphQLServer.requests.length, 0)
    } finally {
        await graphQLServer.close()
    }
})

test("namespace callback never links a namespace without a matching login state", async () => {
    const graphQLServer = await createGraphQLTestServer([])
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url
    const returnPath = "/en/licenses/customer/3/license/9/edit"

    try {
        const response = await selectLicenseNamespace(
            new Request(
                `https://0.0.0.0:3000/api/crater/licenses/namespace/callback?returnPath=${encodeURIComponent(returnPath)}&namespace=${encodeURIComponent("gid://sagittarius/Namespace/666")}&token=attacker-token`
            )
        )

        assert.equal(response.headers.get("location"), `https://code0.example${returnPath}?namespaceError=session`)
        assert.deepEqual(sessionCookies(response), [])
        assert.equal(graphQLServer.requests.length, 0)
    } finally {
        await graphQLServer.close()
    }
})

test("a used login state is cleared so the callback link cannot be replayed", async () => {
    const response = await completeCraterLogin(
        new Request("https://0.0.0.0:3000/api/crater/auth/callback?returnPath=%2Fen%2Fcheckout&state=" + "s".repeat(43), {
            headers: { cookie: `crater_login_state=${"s".repeat(43)}` },
        })
    )

    assert.match(loginStateCookie(response), /^crater_login_state=;.*Max-Age=0/i)
})
