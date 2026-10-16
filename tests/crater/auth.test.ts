import { readGuestCheckoutSession } from "../../src/lib/checkout/guestCheckoutSession"
import assert from "node:assert/strict"
import test from "node:test"
import { PATCH as updateCustomer } from "../../src/app/api/crater/customer/route"
import { POST as createGuestUser } from "../../src/app/api/crater/guest/route"
import { POST as createSession } from "../../src/app/api/crater/login/route"
import { DELETE as deleteSession, GET as getSessionStatus } from "../../src/app/api/crater/auth/session/route"
import { GET as completeCraterLogin } from "../../src/app/api/crater/auth/callback/route"
import { GET as getLicenseDashboard } from "../../src/app/api/crater/licenses/route"
import { createGraphQLTestServer, withGraphQLServer } from "../helpers/graphqlTestServer"

const previousServerUrl = process.env.SERVER_URL
test.before(() => {
    process.env.SERVER_URL = "https://code0.example"
})
test.after(() => {
    if (previousServerUrl === undefined) delete process.env.SERVER_URL
    else process.env.SERVER_URL = previousServerUrl
})

const sessionHeaders = {
    authorization: "Session c_ust_example",
    "content-type": "application/json",
}

const LOGIN_STATE = "s".repeat(43)

// Callbacks only accept a login whose state matches the cookie set by /api/crater/auth/start.
function startedLoginCallback(url: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers)
    headers.set("cookie", `crater_login_state=${LOGIN_STATE}`)
    return new Request(`${url}&state=${LOGIN_STATE}`, { ...init, headers })
}

test("Crater login requires a Sagittarius token", async () => {
    const configuredToken = process.env.CRATER_SAGITTARIUS_TOKEN
    process.env.CRATER_SAGITTARIUS_TOKEN = "legacy-fallback-token"

    try {
        const response = await createSession(
            new Request("https://example.com/api/crater/login", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({}),
            })
        )

        assert.equal(response.status, 400)
        assert.deepEqual(await response.json(), {
            error: "sagittariusToken is required.",
        })
        assert.equal(response.headers.get("cache-control"), "no-store")
    } finally {
        if (configuredToken === undefined) delete process.env.CRATER_SAGITTARIUS_TOKEN
        else process.env.CRATER_SAGITTARIUS_TOKEN = configuredToken
    }
})

test("Crater login returns retry guidance after its rate limit is exceeded", async () => {
    const previousMax = process.env.CRATER_LOGIN_RATE_LIMIT_MAX
    const previousWindow = process.env.CRATER_LOGIN_RATE_LIMIT_WINDOW_SECONDS
    const previousProxyHops = process.env.CRATER_RATE_LIMIT_TRUSTED_PROXY_HOPS
    const originalWarn = console.warn
    const warnings: string[] = []
    console.warn = (message) => warnings.push(String(message))
    process.env.CRATER_LOGIN_RATE_LIMIT_MAX = "2"
    process.env.CRATER_LOGIN_RATE_LIMIT_WINDOW_SECONDS = "60"
    process.env.CRATER_RATE_LIMIT_TRUSTED_PROXY_HOPS = "1"

    const request = () =>
        new Request("https://example.com/api/crater/login", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-forwarded-for": "192.0.2.240",
            },
            body: JSON.stringify({}),
        })

    try {
        assert.equal((await createSession(request())).status, 400)
        assert.equal((await createSession(request())).status, 400)

        const response = await createSession(request())
        assert.equal(response.status, 429)
        assert.equal(response.headers.get("retry-after"), "60")
        assert.equal(response.headers.get("ratelimit-limit"), "2")
        assert.equal(response.headers.get("ratelimit-remaining"), "0")
        assert.equal(response.headers.get("ratelimit-reset"), "60")
        assert.equal(response.headers.get("cache-control"), "no-store")
        assert.equal(warnings.length, 1)
        assert.deepEqual(JSON.parse(warnings[0]), {
            timestamp: JSON.parse(warnings[0]).timestamp,
            event: "rate_limit_exceeded",
            policy: "login",
            limit: 2,
            retryAfterSeconds: 60,
            network: "trusted",
        })
    } finally {
        console.warn = originalWarn
        if (previousMax === undefined) delete process.env.CRATER_LOGIN_RATE_LIMIT_MAX
        else process.env.CRATER_LOGIN_RATE_LIMIT_MAX = previousMax
        if (previousWindow === undefined) delete process.env.CRATER_LOGIN_RATE_LIMIT_WINDOW_SECONDS
        else process.env.CRATER_LOGIN_RATE_LIMIT_WINDOW_SECONDS = previousWindow
        if (previousProxyHops === undefined) delete process.env.CRATER_RATE_LIMIT_TRUSTED_PROXY_HOPS
        else process.env.CRATER_RATE_LIMIT_TRUSTED_PROXY_HOPS = previousProxyHops
    }
})

test("continuing as a guest creates a Sagittarius guest user for the entered email", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                usersCreateGuestUser: {
                    claimToken: "guest-claim-token",
                    errors: [],
                    userSession: { id: "gid://crater/UserSession/9", token: "crater-guest-session" },
                },
            },
        },
    ])
    const previousSecret = process.env.PAYLOAD_SECRET
    process.env.PAYLOAD_SECRET = "test-only-checkout-cookie-secret"
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await createGuestUser(
            new Request("https://example.com/api/crater/guest", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email: " guest@example.com " }),
            })
        )

        assert.equal(response.status, 200)
        const body = await response.json()
        assert.equal(body.authenticated, true)
        assert.match(body.checkoutId, /^[a-f0-9]{32}$/)
        assert.equal(graphQLServer.requests[0].body.operationName, "UsersCreateGuestUser")
        assert.deepEqual(graphQLServer.requests[0].body.variables, { input: { email: "guest@example.com" } })

        const setCookies = response.headers.getSetCookie()
        assert.equal(setCookies.length, 1)
        const cookie = setCookies[0]
        assert.match(cookie, /HttpOnly/i)
        assert.match(cookie, /Path=\/api\/crater/i)
        assert.doesNotMatch(cookie, /crater_session=|crater_user_login=|guest-claim-token|crater-guest-session|Max-Age|Expires/i)
        const session = readGuestCheckoutSession(
            new Request("https://example.com/api/crater/customer", {
                headers: { "x-guest-checkout": body.checkoutId, cookie: cookie.split(";")[0] },
            })
        )
        assert.equal(session?.token, "crater-guest-session")
        assert.equal(session?.claimToken, "guest-claim-token")
        assert.equal(session?.email, "guest@example.com")
    } finally {
        if (previousSecret === undefined) delete process.env.PAYLOAD_SECRET
        else process.env.PAYLOAD_SECRET = previousSecret
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("guest creation refuses a blank, malformed or oversized email before reaching Crater", async () => {
    await withGraphQLServer([], async (graphQLServer) => {
        for (const email of [
            undefined,
            "",
            "   ",
            "not-an-email",
            "missing-domain@",
            "@example.com",
            "no-dot@example",
            "two@at@example.com",
            "space in@example.com",
            "line\nbreak@example.com",
            `${"a".repeat(65)}@example.com`,
            `guest@${"a".repeat(250)}.com`,
        ]) {
            const response = await createGuestUser(
                new Request("https://example.com/api/crater/guest", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify(email === undefined ? {} : { email }),
                })
            )

            assert.equal(response.status, 400)
            assert.deepEqual(await response.json(), { error: "A valid email is required to continue as a guest." })
        }

        assert.equal(graphQLServer.requests.length, 0)
    })
})

test("guest creation forwards the Crater error code without a session cookie", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                usersCreateGuestUser: {
                    claimToken: null,
                    errors: [{ errorCode: "GUEST_USER_CREATION_FAILED", details: [] }],
                    userSession: null,
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url
    const originalWarn = console.warn
    console.warn = () => {}

    try {
        const response = await createGuestUser(
            new Request("https://example.com/api/crater/guest", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email: "guest@example.com" }),
            })
        )

        assert.equal(response.status, 422)
        assert.equal(((await response.json()) as { errorCode: string }).errorCode, "GUEST_USER_CREATION_FAILED")
        assert.equal(response.headers.getSetCookie().length, 0)
    } finally {
        console.warn = originalWarn
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("an exhausted guest budget leaves the plain session route usable", async () => {
    const environmentKeys = ["CRATER_GUEST_RATE_LIMIT_MAX", "CRATER_GUEST_RATE_LIMIT_WINDOW_SECONDS", "CRATER_RATE_LIMIT_TRUSTED_PROXY_HOPS"] as const
    const previousEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]))
    process.env.CRATER_GUEST_RATE_LIMIT_MAX = "1"
    process.env.CRATER_GUEST_RATE_LIMIT_WINDOW_SECONDS = "90"
    process.env.CRATER_RATE_LIMIT_TRUSTED_PROXY_HOPS = "1"

    const request = (path: string) =>
        new Request(`https://example.com${path}`, {
            method: "POST",
            headers: { "content-type": "application/json", "x-forwarded-for": "192.0.2.242" },
            body: JSON.stringify({}),
        })

    const originalWarn = console.warn
    console.warn = () => {}

    try {
        // A Sagittarius that refuses every guest would otherwise take the checkout's own session route with
        // it, because both used to consume the same bucket.
        assert.equal((await createGuestUser(request("/api/crater/guest"))).status, 400)
        assert.equal((await createGuestUser(request("/api/crater/guest"))).status, 429)
        assert.equal((await createSession(request("/api/crater/login"))).status, 400)
    } finally {
        console.warn = originalWarn
        for (const key of environmentKeys) {
            if (previousEnvironment[key] === undefined) delete process.env[key]
            else process.env[key] = previousEnvironment[key]
        }
    }
})

test("server-side login callback redirects from the container to the configured origin with an HttpOnly Crater cookie", async () => {
    await withGraphQLServer([
        {
            data: {
                usersLogin: {
                    errors: [],
                    userSession: {
                        active: true,
                        createdAt: "2026-08-15T10:00:00Z",
                        id: "gid://crater/UserSession/1",
                        token: "crater-callback-session",
                        updatedAt: "2026-08-15T10:00:00Z",
                    },
                },
            },
        },
    ], async (graphQLServer) => {
        const returnPath = "/de/checkout?plan=pro&deploymentType=self_hosted"
        const response = await completeCraterLogin(startedLoginCallback(`https://0.0.0.0:3000/api/crater/auth/callback?returnPath=${encodeURIComponent(returnPath)}&token=sagittarius-secret`))

        assert.equal(response.status, 307)
        assert.equal(response.headers.get("location"), `https://code0.example${returnPath}`)
        assert.equal(response.headers.get("cache-control"), "no-store")
        assert.equal(response.headers.get("referrer-policy"), "no-referrer")
        const setCookies = response.headers.getSetCookie()
        const sessionCookie = setCookies.find((cookie) => cookie.startsWith("crater_session=")) ?? ""
        const loginMarker = setCookies.find((cookie) => cookie.startsWith("crater_user_login=")) ?? ""
        assert.match(sessionCookie, /crater_session=crater-callback-session/)
        assert.match(sessionCookie, /HttpOnly/i)
        // The marker says "this browser completed the Sagittarius login" so an expired account session
        // returns to the login choice instead of silently falling back to the shared checkout session.
        // It holds no token, is readable by the checkout, and covers the whole site.
        assert.match(loginMarker, /crater_user_login=1/)
        assert.doesNotMatch(loginMarker, /HttpOnly/i)
        assert.match(loginMarker, /Path=\//i)
        assert.doesNotMatch(loginMarker, /crater-callback-session|sagittarius-secret/)
        assert.doesNotMatch(response.headers.get("location") ?? "", /sagittarius-secret|[?&]token=/)
        assert.deepEqual(graphQLServer.requests[0].body.variables, {
            input: { sagittariusToken: "sagittarius-secret" },
        })
    })
})

test("server-side login callback preserves the selected namespace for cloud checkout", async () => {
    await withGraphQLServer([
        {
            data: {
                usersLogin: {
                    errors: [],
                    userSession: {
                        active: true,
                        createdAt: "2026-08-15T10:00:00Z",
                        id: "gid://crater/UserSession/1",
                        token: "crater-callback-session",
                        updatedAt: "2026-08-15T10:00:00Z",
                    },
                },
            },
        },
    ], async (graphQLServer) => {
        const returnPath = "/de/checkout?plan=pro&deploymentType=cloud"
        const namespace = "gid://sagittarius/Namespace/9"
        const response = await completeCraterLogin(
            startedLoginCallback(`https://0.0.0.0:3000/api/crater/auth/callback?returnPath=${encodeURIComponent(returnPath)}&namespace=${encodeURIComponent(namespace)}&token=sagittarius-secret`)
        )

        assert.equal(response.status, 307)
        const location = new URL(response.headers.get("location") ?? "")
        assert.equal(location.origin, "https://code0.example")
        assert.equal(location.pathname, "/de/checkout")
        assert.equal(location.searchParams.get("namespace"), namespace)
        assert.equal(location.searchParams.get("token"), null)
        assert.equal(location.searchParams.get("authError"), null)
    })
})

test("server-side login callback logs why Crater rejected the login without leaking it to the user", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                usersLogin: {
                    errors: [{ errorCode: "INVALID_SAGITTARIUS_TOKEN", details: [{ __typename: "MessageError", message: "The token was rejected." }] }],
                    userSession: null,
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url
    const originalConsoleError = console.error
    const loggedArguments: unknown[][] = []
    console.error = (...args: unknown[]) => {
        loggedArguments.push(args)
    }

    try {
        const response = await completeCraterLogin(startedLoginCallback("https://0.0.0.0:3000/api/crater/auth/callback?returnPath=%2Fde%2Fcheckout&token=sagittarius-secret"))

        assert.equal(response.status, 307)
        assert.equal(response.headers.get("location"), "https://code0.example/de/checkout?authError=session")
        assert.deepEqual(response.headers.getSetCookie().map((cookie) => cookie.split("=")[0]), ["crater_login_state"])
        assert.doesNotMatch(response.headers.get("location") ?? "", /INVALID_SAGITTARIUS_TOKEN|sagittarius-secret/)
        assert.deepEqual(loggedArguments, [["Crater rejected the server-side login callback:", "INVALID_SAGITTARIUS_TOKEN: The token was rejected."]])
    } finally {
        console.error = originalConsoleError
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("server-side login callback rejects external return paths and never forwards the token", async () => {
    for (const returnPath of ["https://evil.example/collect", "//evil.example/de/checkout", "//0.0.0.0:3000/de/checkout", "/de/subscription"]) {
        const response = await completeCraterLogin(
            new Request(`https://0.0.0.0:3000/api/crater/auth/callback?returnPath=${encodeURIComponent(returnPath)}&token=sagittarius-secret`)
        )

        assert.equal(response.status, 307)
        assert.equal(response.headers.get("location"), "https://code0.example/?authError=session")
        assert.doesNotMatch(response.headers.get("location") ?? "", /token=/)
    }
})

test("server-side login callback reads the public origin at runtime and ignores forwarded hosts when the token is missing", async () => {
    const previousServerUrl = process.env.SERVER_URL

    try {
        for (const siteOrigin of ["https://staging.example.com", "https://production.example.com"]) {
            process.env.SERVER_URL = siteOrigin
            const response = await completeCraterLogin(
                new Request("https://0.0.0.0:3000/api/crater/auth/callback?returnPath=%2Fen%2Fcheckout", {
                    headers: { host: "evil.example", "x-forwarded-host": "evil.example" },
                })
            )

            assert.equal(response.headers.get("location"), `${siteOrigin}/en/checkout?authError=session`)
            assert.equal(response.headers.get("set-cookie"), null)
        }
    } finally {
        if (previousServerUrl === undefined) delete process.env.SERVER_URL
        else process.env.SERVER_URL = previousServerUrl
    }
})

test("logout revokes the Crater session before clearing its persisted cookie", async () => {
    await withGraphQLServer([{ data: { usersLogout: { errors: [] } } }], async (graphQLServer) => {
        const response = await deleteSession(
            new Request("https://example.com/api/crater/auth/session", {
                method: "DELETE",
                headers: { cookie: "crater_session=c_ust_example" },
            })
        )

        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { authenticated: false })
        assert.match(response.headers.get("set-cookie") ?? "", /crater_session=;/)
        assert.match(response.headers.get("set-cookie") ?? "", /Max-Age=0/i)
        assert.equal(graphQLServer.requests[0].authorization, "Session c_ust_example")
        assert.deepEqual(graphQLServer.requests[0].body.variables, { input: {} })
        assert.match(graphQLServer.requests[0].body.query ?? "", /usersLogout/)
    })
})

test("logout keeps the local session available for retry when Crater rejects revocation", async () => {
    await withGraphQLServer([
        {
            data: {
                usersLogout: {
                    errors: [{ errorCode: "MISSING_PERMISSION", details: [{ __typename: "MessageError", message: "Logout denied" }] }],
                },
            },
        },
    ], async (graphQLServer) => {
        const response = await deleteSession(
            new Request("https://example.com/api/crater/auth/session", {
                method: "DELETE",
                headers: { cookie: "crater_session=c_ust_example" },
            })
        )

        assert.equal(response.status, 422)
        assert.deepEqual(await response.json(), {
            error: "Crater could not revoke the user session.",
            errorCode: "MISSING_PERMISSION",
            details: ["Logout denied"],
        })
        assert.equal(response.headers.get("set-cookie"), null)
    })
})

test("maps login and customer updates to Crater GraphQL inputs", async () => {
    await withGraphQLServer([
        {
            data: {
                usersLogin: {
                    errors: [],
                    userSession: {
                        active: true,
                        createdAt: "2026-07-30T10:00:00Z",
                        id: "gid://crater/UserSession/1",
                        token: "crater-session-token",
                        updatedAt: "2026-07-30T10:00:00Z",
                    },
                },
            },
        },
        {
            data: {
                customersUpdate: {
                    errors: [],
                    customer: {
                        address: {
                            city: "Hamburg",
                            country: "DE",
                            line1: "Speicherstadt 1",
                            line2: null,
                            postalCode: "20457",
                            state: null,
                        },
                        id: "gid://crater/Customer/7",
                        customerType: "business",
                        email: "new@example.com",
                        name: "Updated GmbH",
                        phone: null,
                    },
                },
            },
        },
    ], async (graphQLServer) => {
        const loginResponse = await createSession(
            new Request("https://example.com/api/crater/login", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    sagittariusToken: "sagittarius-token",
                    clientMutationId: "login-1",
                }),
            })
        )
        assert.equal(loginResponse.status, 200)
        assert.deepEqual(await loginResponse.json(), { authenticated: true })
        assert.match(loginResponse.headers.get("set-cookie") ?? "", /crater_session=crater-session-token/)
        assert.match(loginResponse.headers.get("set-cookie") ?? "", /HttpOnly/i)

        const updateResponse = await updateCustomer(
            new Request("https://example.com/api/crater/customer", {
                method: "PATCH",
                headers: sessionHeaders,
                body: JSON.stringify({
                    id: "gid://crater/Customer/7",
                    email: "new@example.com",
                    name: "Updated GmbH",
                    phone: null,
                    address: {
                        city: "Hamburg",
                        country: "DE",
                        line1: "Speicherstadt 1",
                        line2: null,
                        postalCode: "20457",
                        state: null,
                    },
                }),
            })
        )
        assert.equal(updateResponse.status, 200)

        assert.equal(graphQLServer.requests.length, 2)
        assert.equal(graphQLServer.requests[0].authorization, undefined)
        assert.equal(graphQLServer.requests[0].body.operationName, "UsersLogin")
        assert.deepEqual(graphQLServer.requests[0].body.variables, {
            input: {
                sagittariusToken: "sagittarius-token",
                clientMutationId: "login-1",
            },
        })
        assert.match(graphQLServer.requests[0].body.query ?? "", /usersLogin\(input: \$input\)/)

        assert.equal(graphQLServer.requests[1].authorization, "Session c_ust_example")
        assert.deepEqual(graphQLServer.requests[1].body.variables, {
            input: {
                id: "gid://crater/Customer/7",
                email: "new@example.com",
                name: "Updated GmbH",
                phone: null,
                address: {
                    city: "Hamburg",
                    country: "DE",
                    line1: "Speicherstadt 1",
                    line2: null,
                    postalCode: "20457",
                    state: null,
                },
            },
        })
    })
})

test("clears a Crater session that has no authenticated user", async () => {
    await withGraphQLServer([{ data: { currentUser: null } }], async (graphQLServer) => {
        const response = await getSessionStatus(
            new Request("https://example.com/api/crater/auth/session", {
                headers: { cookie: "crater_session=orphaned-token" },
            })
        )

        assert.equal(response.status, 401)
        assert.match(response.headers.get("set-cookie") ?? "", /crater_session=;/)
        assert.match(response.headers.get("set-cookie") ?? "", /Max-Age=0/i)
    })
})

test("clears a malformed Crater session cookie", async () => {
    const response = await getSessionStatus(
        new Request("https://example.com/api/crater/auth/session", {
            headers: { cookie: "crater_session=token%20with%20spaces" },
        })
    )

    assert.equal(response.status, 401)
    const setCookies = response.headers.getSetCookie()
    // A session that is gone must take the login marker with it, or a later checkout treats this browser
    // as though its account session had only just expired.
    for (const name of ["crater_session", "crater_user_login"]) {
        const cleared = setCookies.find((cookie) => cookie.startsWith(`${name}=`)) ?? ""
        assert.match(cleared, new RegExp(`${name}=;`))
        assert.match(cleared, /Max-Age=0/i)
    }
})

test("license dashboard requires a Crater session", async () => {
    const response = await getLicenseDashboard(new Request("https://example.com/api/crater/licenses"))

    assert.equal(response.status, 403)
    assert.equal(response.headers.get("cache-control"), "no-store")
})

