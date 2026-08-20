import assert from "node:assert/strict"
import test from "node:test"
import { GET as listCustomers, PATCH as updateCustomer, POST as createOrGetCustomer } from "../../src/app/api/crater/customer/route"
import { GET as getCustomerPaymentMethodSetupStatus, POST as createCustomerPaymentMethodSetup } from "../../src/app/api/crater/customer/payment-method-setup/route"
import { POST as validateDiscount } from "../../src/app/api/crater/checkout/discount/route"
import { POST as calculateTax } from "../../src/app/api/crater/checkout/tax/route"
import { POST as createSession } from "../../src/app/api/crater/login/route"
import { DELETE as deleteSession, GET as getSessionStatus } from "../../src/app/api/crater/auth/session/route"
import { GET as completeCraterLogin } from "../../src/app/api/crater/auth/callback/route"
import { GET as getLicenseDashboard, PATCH as linkLicenseNamespace } from "../../src/app/api/crater/licenses/route"
import { GET as accessLicenseDashboard } from "../../src/app/api/crater/licenses/access/route"
import { GET as getCheckoutLicenseStatus } from "../../src/app/api/crater/checkout/status/route"
import { GET as getSubscriptionPaymentMethod } from "../../src/app/api/crater/subscriptions/payment-method/route"
import { GET as getSubscriptionPaymentMethodSetupStatus, POST as createSubscriptionPaymentMethodSetup } from "../../src/app/api/crater/subscriptions/payment-method-setup/route"
import { createGraphQLTestServer } from "./graphqlTestServer"

const sessionHeaders = {
    authorization: "Session c_ust_example",
    "content-type": "application/json",
}

test("Crater login requires a Sagittarius token", async () => {
    const configuredToken = process.env.CRATER_SAGITTARIUS_TOKEN
    delete process.env.CRATER_SAGITTARIUS_TOKEN

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
        if (configuredToken === undefined) {
            delete process.env.CRATER_SAGITTARIUS_TOKEN
        } else {
            process.env.CRATER_SAGITTARIUS_TOKEN = configuredToken
        }
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
            scope: "anonymous",
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

test("server-side login callback exchanges Sagittarius for an HttpOnly Crater cookie", async () => {
    const graphQLServer = await createGraphQLTestServer([
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
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const returnPath = "/de/checkout?plan=pro&deploymentType=self_hosted"
        const response = await completeCraterLogin(new Request(`https://code0.example/api/crater/auth/callback?returnPath=${encodeURIComponent(returnPath)}&token=sagittarius-secret`))

        assert.equal(response.status, 307)
        assert.equal(response.headers.get("location"), `https://code0.example${returnPath}`)
        assert.equal(response.headers.get("cache-control"), "no-store")
        assert.equal(response.headers.get("referrer-policy"), "no-referrer")
        assert.match(response.headers.get("set-cookie") ?? "", /crater_session=crater-callback-session/)
        assert.match(response.headers.get("set-cookie") ?? "", /HttpOnly/i)
        assert.doesNotMatch(response.headers.get("location") ?? "", /sagittarius-secret|[?&]token=/)
        assert.deepEqual(graphQLServer.requests[0].body.variables, {
            input: { sagittariusToken: "sagittarius-secret" },
        })
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
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
        const response = await completeCraterLogin(new Request("https://code0.example/api/crater/auth/callback?returnPath=%2Fde%2Fcheckout&token=sagittarius-secret"))

        assert.equal(response.status, 307)
        assert.equal(response.headers.get("location"), "https://code0.example/de/checkout?authError=session")
        assert.equal(response.headers.get("set-cookie"), null)
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
    const response = await completeCraterLogin(new Request("https://code0.example/api/crater/auth/callback?returnPath=https%3A%2F%2Fevil.example%2Fcollect&token=sagittarius-secret"))

    assert.equal(response.status, 307)
    assert.equal(response.headers.get("location"), "https://code0.example/?authError=session")
    assert.doesNotMatch(response.headers.get("location") ?? "", /token=/)
})

test("customer creation requires a Crater session", async () => {
    const response = await createOrGetCustomer(
        new Request("https://example.com/api/crater/customer", {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                customerType: "personal",
                email: "person@example.com",
                name: "Example Person",
            }),
        })
    )

    assert.equal(response.status, 403)
})

test("payment method setup requires a Crater session", async () => {
    const response = await createCustomerPaymentMethodSetup(
        new Request("https://example.com/api/crater/customer/payment-method-setup", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ customerId: "gid://crater/Customer/1" }),
        })
    )

    assert.equal(response.status, 403)
})

test("subscription payment method summary requires a Crater session", async () => {
    const response = await getSubscriptionPaymentMethod(new Request("https://example.com/api/crater/subscriptions/payment-method?subscriptionId=gid%3A%2F%2Fcrater%2FSubscription%2F1"))

    assert.equal(response.status, 403)
    assert.equal(response.headers.get("cache-control"), "no-store")
})

test("returns only the subscription payment method display summary from Crater", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                subscriptionPaymentMethod: {
                    brand: "visa",
                    expiresMonth: 12,
                    expiresYear: 2030,
                    last4: "4242",
                    type: "card",
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await getSubscriptionPaymentMethod(
            new Request("https://example.com/api/crater/subscriptions/payment-method?subscriptionId=gid%3A%2F%2Fcrater%2FSubscription%2F1", {
                headers: sessionHeaders,
            })
        )

        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), {
            paymentMethod: { brand: "visa", expiresMonth: 12, expiresYear: 2030, last4: "4242", type: "card" },
        })
        assert.equal(response.headers.get("cache-control"), "no-store")
        assert.equal(graphQLServer.requests[0].body.operationName, "SubscriptionPaymentMethod")
        assert.deepEqual(graphQLServer.requests[0].body.variables, { subscriptionId: "gid://crater/Subscription/1" })
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("subscription payment method setup requires a Crater session", async () => {
    const response = await createSubscriptionPaymentMethodSetup(
        new Request("https://example.com/api/crater/subscriptions/payment-method-setup", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ subscriptionId: "gid://crater/Subscription/1" }),
        })
    )

    assert.equal(response.status, 403)
})

test("creates a SetupIntent for the selected subscription", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                subscriptionPaymentMethodSetupCreate: {
                    errors: [],
                    session: { clientSecret: "seti_subscription_secret_test" },
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await createSubscriptionPaymentMethodSetup(
            new Request("https://example.com/api/crater/subscriptions/payment-method-setup", {
                method: "POST",
                headers: sessionHeaders,
                body: JSON.stringify({ subscriptionId: "gid://crater/Subscription/1" }),
            })
        )

        assert.equal(response.status, 201)
        assert.deepEqual(await response.json(), { clientSecret: "seti_subscription_secret_test" })
        assert.equal(graphQLServer.requests[0].body.operationName, "SubscriptionPaymentMethodSetupCreate")
        assert.deepEqual(graphQLServer.requests[0].body.variables, {
            input: { subscriptionId: "gid://crater/Subscription/1" },
        })
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("returns the verified subscription payment method setup status", async () => {
    const graphQLServer = await createGraphQLTestServer([{ data: { subscriptionPaymentMethodSetupStatus: "READY" } }])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await getSubscriptionPaymentMethodSetupStatus(
            new Request("https://example.com/api/crater/subscriptions/payment-method-setup?subscriptionId=gid%3A%2F%2Fcrater%2FSubscription%2F1&setupIntentId=seti_example", {
                headers: sessionHeaders,
            })
        )

        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { status: "ready" })
        assert.equal(graphQLServer.requests[0].body.operationName, "SubscriptionPaymentMethodSetupStatus")
        assert.deepEqual(graphQLServer.requests[0].body.variables, {
            setupIntentId: "seti_example",
            subscriptionId: "gid://crater/Subscription/1",
        })
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("payment method setup status requires a Crater session", async () => {
    const response = await getCustomerPaymentMethodSetupStatus(
        new Request("https://example.com/api/crater/customer/payment-method-setup?customerId=gid%3A%2F%2Fcrater%2FCustomer%2F1&setupIntentId=seti_example")
    )

    assert.equal(response.status, 403)
    assert.equal(response.headers.get("cache-control"), "no-store")
})

test("payment method setup status rejects customers outside the Crater session", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                currentUser: {
                    customers: { nodes: [{ id: "gid://crater/Customer/2" }] },
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await getCustomerPaymentMethodSetupStatus(
            new Request("https://example.com/api/crater/customer/payment-method-setup?customerId=gid%3A%2F%2Fcrater%2FCustomer%2F1&setupIntentId=seti_example", {
                headers: sessionHeaders,
            })
        )

        assert.equal(response.status, 404)
        assert.deepEqual(await response.json(), { error: "The payment method setup was not found." })
        assert.equal(graphQLServer.requests[0].body.operationName, "CustomerPaymentMethodSetupStatus")
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("creates a Stripe payment method SetupIntent for the selected customer", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                customerPaymentMethodSetupCreate: {
                    errors: [],
                    session: { clientSecret: "seti_test_secret_test" },
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await createCustomerPaymentMethodSetup(
            new Request("https://example.com/api/crater/customer/payment-method-setup", {
                method: "POST",
                headers: sessionHeaders,
                body: JSON.stringify({ customerId: "gid://crater/Customer/1" }),
            })
        )

        assert.equal(response.status, 201)
        assert.deepEqual(await response.json(), { clientSecret: "seti_test_secret_test" })
        assert.equal(graphQLServer.requests[0].body.operationName, "CustomerPaymentMethodSetupCreate")
        assert.deepEqual(graphQLServer.requests[0].body.variables, {
            input: { customerId: "gid://crater/Customer/1" },
        })
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("surfaces Crater payment method setup domain errors", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                customerPaymentMethodSetupCreate: {
                    errors: [{ errorCode: "INVALID_PAYMENT_METHOD_SETUP_CUSTOMER", details: [] }],
                    session: null,
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await createCustomerPaymentMethodSetup(
            new Request("https://example.com/api/crater/customer/payment-method-setup", {
                method: "POST",
                headers: sessionHeaders,
                body: JSON.stringify({ customerId: "gid://crater/Customer/1" }),
            })
        )

        assert.equal(response.status, 422)
        assert.deepEqual(await response.json(), {
            error: "Crater could not create the payment method setup session.",
            errorCode: "INVALID_PAYMENT_METHOD_SETUP_CUSTOMER",
            details: [],
        })
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("checkout completion status requires a Crater session", async () => {
    const response = await getCheckoutLicenseStatus(new Request("https://example.com/api/crater/checkout/status?sessionId=cs_test_example"))

    assert.equal(response.status, 403)
    assert.equal(response.headers.get("cache-control"), "no-store")
})

test("checkout completion status requires a valid Stripe Checkout Session id", async () => {
    const response = await getCheckoutLicenseStatus(
        new Request("https://example.com/api/crater/checkout/status?sessionId=invalid", {
            headers: sessionHeaders,
        })
    )

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: "A valid checkout session is required." })
})

test("checkout completion status is bound to Crater's server-resolved customer, payment, and license", async () => {
    const customerId = "gid://crater/Customer/1"
    const sessionId = "cs_test_checkout123"
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                checkoutCompletionStatus: {
                    state: "PAYMENT_PENDING",
                    customerId,
                    licenseId: null,
                },
            },
        },
        {
            data: {
                checkoutCompletionStatus: {
                    state: "READY",
                    customerId,
                    licenseId: "gid://crater/License/2",
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const requestUrl = `https://example.com/api/crater/checkout/status?sessionId=${sessionId}`
        const pendingResponse = await getCheckoutLicenseStatus(new Request(requestUrl, { headers: sessionHeaders }))
        const readyResponse = await getCheckoutLicenseStatus(new Request(requestUrl, { headers: sessionHeaders }))

        assert.equal(pendingResponse.status, 200)
        assert.deepEqual(await pendingResponse.json(), { state: "PAYMENT_PENDING", customerId, licenseId: null })
        assert.equal(readyResponse.status, 200)
        assert.deepEqual(await readyResponse.json(), { state: "READY", customerId, licenseId: "gid://crater/License/2" })
        assert.equal(graphQLServer.requests[0].body.operationName, "CheckoutCompletionStatus")
        assert.deepEqual(graphQLServer.requests[0].body.variables, { sessionId })
        assert.match(graphQLServer.requests[0].body.query ?? "", /checkoutCompletionStatus\(sessionId: \$sessionId\)/)
        assert.doesNotMatch(graphQLServer.requests[0].body.query ?? "", /currentUser|createdAt/)
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("checkout completion status does not expose foreign or inconsistent sessions", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            errors: [
                {
                    message: "Invalid checkout status session",
                    extensions: { errorCode: "INVALID_CHECKOUT_STATUS_SESSION" },
                },
            ],
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await getCheckoutLicenseStatus(
            new Request("https://example.com/api/crater/checkout/status?sessionId=cs_test_foreign123", {
                headers: sessionHeaders,
            })
        )

        assert.equal(response.status, 404)
        assert.deepEqual(await response.json(), {
            error: "The checkout session could not be verified.",
            errorCode: "INVALID_CHECKOUT_STATUS_SESSION",
        })
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("checkout completion status marks temporary Crater status failures as retryable", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            errors: [
                {
                    message: "Stripe unavailable",
                    extensions: { errorCode: "CHECKOUT_STATUS_UNAVAILABLE" },
                },
            ],
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await getCheckoutLicenseStatus(
            new Request("https://example.com/api/crater/checkout/status?sessionId=cs_test_unavailable123", {
                headers: sessionHeaders,
            })
        )

        assert.equal(response.status, 503)
        assert.deepEqual(await response.json(), {
            error: "The checkout status is temporarily unavailable.",
            errorCode: "CHECKOUT_STATUS_UNAVAILABLE",
        })
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("lists the authenticated user's checkout customers", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                currentUser: {
                    customers: {
                        nodes: [
                            {
                                address: null,
                                createdAt: "2026-08-12T12:00:00Z",
                                customerType: "personal",
                                email: "ada@example.com",
                                id: "gid://crater/Customer/1",
                                name: "Ada Lovelace",
                                phone: null,
                                updatedAt: "2026-08-12T12:00:00Z",
                            },
                        ],
                    },
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await listCustomers(
            new Request("https://example.com/api/crater/customer", {
                headers: { authorization: "Session customer-list-token" },
            })
        )

        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), {
            customers: [
                {
                    address: null,
                    createdAt: "2026-08-12T12:00:00Z",
                    customerType: "personal",
                    email: "ada@example.com",
                    id: "gid://crater/Customer/1",
                    name: "Ada Lovelace",
                    phone: null,
                    updatedAt: "2026-08-12T12:00:00Z",
                },
            ],
            pageInfo: { endCursor: null, hasNextPage: false },
        })
        assert.equal(graphQLServer.requests[0].authorization, "Session customer-list-token")
        assert.equal(graphQLServer.requests[0].body.operationName, "CheckoutCustomers")
        assert.match(graphQLServer.requests[0].body.query ?? "", /customers\(after: \$after, first: 50\)/)
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("paginates checkout customers with Crater's cursor", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                currentUser: {
                    customers: {
                        nodes: [{ customerType: "business", id: "gid://crater/Customer/51" }],
                        pageInfo: { endCursor: "customer-100", hasNextPage: true },
                    },
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await listCustomers(
            new Request("https://example.com/api/crater/customer?after=customer-50", {
                headers: sessionHeaders,
            })
        )

        assert.equal(response.status, 200)
        assert.deepEqual(graphQLServer.requests[0].body.variables, { after: "customer-50" })
        assert.deepEqual(await response.json(), {
            customers: [{ customerType: "business", id: "gid://crater/Customer/51" }],
            pageInfo: { endCursor: "customer-100", hasNextPage: true },
        })
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("logout revokes the Crater session before clearing its persisted cookie", async () => {
    const graphQLServer = await createGraphQLTestServer([{ data: { usersLogout: { errors: [] } } }])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
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
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("logout keeps the local session available for retry when Crater rejects revocation", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                usersLogout: {
                    errors: [{ errorCode: "MISSING_PERMISSION", details: [{ __typename: "MessageError", message: "Logout denied" }] }],
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
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
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("business customer creation allows omitted contact and tax fields", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                customersCreate: {
                    errors: [],
                    customer: {
                        id: "gid://crater/Customer/1",
                        customerType: "business",
                        email: null,
                        name: null,
                    },
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await createOrGetCustomer(
            new Request("https://example.com/api/crater/customer", {
                method: "POST",
                headers: {
                    cookie: "crater_session=c_ust_example",
                    "content-type": "application/json",
                },
                body: JSON.stringify({ customerType: "business" }),
            })
        )

        assert.equal(response.status, 201)
        assert.equal(graphQLServer.requests[0].authorization, "Session c_ust_example")
        assert.deepEqual(graphQLServer.requests[0].body.variables, { input: { customerType: "business" } })
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("customer creation forwards the explicit reuseExisting choice", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                customersCreate: {
                    errors: [],
                    customer: {
                        id: "gid://crater/Customer/2",
                        customerType: "personal",
                        email: null,
                        name: null,
                    },
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await createOrGetCustomer(
            new Request("https://example.com/api/crater/customer", {
                method: "POST",
                headers: sessionHeaders,
                body: JSON.stringify({ customerType: "personal", reuseExisting: false }),
            })
        )

        assert.equal(response.status, 201)
        assert.deepEqual(graphQLServer.requests[0].body.variables, {
            input: { customerType: "personal", reuseExisting: false },
        })
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("draft customer creation forwards its idempotent checkout key", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                customersCreate: {
                    errors: [],
                    customer: {
                        id: "gid://crater/Customer/3",
                        customerType: "personal",
                        email: null,
                        name: null,
                        status: "draft",
                    },
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await createOrGetCustomer(
            new Request("https://example.com/api/crater/customer", {
                method: "POST",
                headers: sessionHeaders,
                body: JSON.stringify({ checkoutKey: "3f456ad7-c94b-4a63-aea2-17bd9dcf65be", customerType: "personal", draft: true }),
            })
        )

        assert.equal(response.status, 201)
        assert.deepEqual(graphQLServer.requests[0].body.variables, {
            input: { checkoutKey: "3f456ad7-c94b-4a63-aea2-17bd9dcf65be", customerType: "personal", draft: true },
        })
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("draft customer creation requires a checkout key", async () => {
    const response = await createOrGetCustomer(
        new Request("https://example.com/api/crater/customer", {
            method: "POST",
            headers: sessionHeaders,
            body: JSON.stringify({ customerType: "personal", draft: true }),
        })
    )

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), {
        error: "checkoutKey is required for draft customers and is only allowed with draft: true.",
    })
})

test("customer creation rejects an existing customer with a different type", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                customersCreate: {
                    errors: [],
                    customer: {
                        id: "gid://crater/Customer/1",
                        customerType: "personal",
                        email: null,
                        name: null,
                    },
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await createOrGetCustomer(
            new Request("https://example.com/api/crater/customer", {
                method: "POST",
                headers: sessionHeaders,
                body: JSON.stringify({ customerType: "business" }),
            })
        )

        assert.equal(response.status, 409)
        assert.deepEqual(await response.json(), {
            error: "The existing customer type does not match the requested checkout customer type.",
            errorCode: "CUSTOMER_TYPE_MISMATCH",
            details: [],
        })
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("customer creation rejects incomplete tax ID fields", async () => {
    const response = await createOrGetCustomer(
        new Request("https://example.com/api/crater/customer", {
            method: "POST",
            headers: sessionHeaders,
            body: JSON.stringify({ customerType: "business", taxIdType: "eu_vat" }),
        })
    )

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: "taxIdType and taxIdValue must be provided together." })
})

test("customer creation surfaces Crater validation details", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                customersCreate: {
                    customer: null,
                    errors: [
                        {
                            errorCode: "INVALID_CUSTOMER",
                            details: [
                                { __typename: "ActiveModelError", attribute: "email", type: "invalid" },
                                { __typename: "MessageError", message: "Stripe rejected the customer." },
                            ],
                        },
                    ],
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await createOrGetCustomer(
            new Request("https://example.com/api/crater/customer", {
                method: "POST",
                headers: sessionHeaders,
                body: JSON.stringify({
                    customerType: "personal",
                    email: "person@example.com",
                    name: "Example Person",
                }),
            })
        )

        assert.equal(response.status, 422)
        assert.deepEqual(await response.json(), {
            error: "Crater could not create the customer.",
            errorCode: "INVALID_CUSTOMER",
            details: ["email: invalid", "Stripe rejected the customer."],
        })
        assert.match(graphQLServer.requests[0].body.query ?? "", /\.\.\. on ActiveModelError/)
        assert.match(graphQLServer.requests[0].body.query ?? "", /\.\.\. on MessageError/)
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("customer updates require a valid Crater customer id", async () => {
    const response = await updateCustomer(
        new Request("https://example.com/api/crater/customer", {
            method: "PATCH",
            headers: sessionHeaders,
            body: JSON.stringify({
                id: "123",
                name: "Updated name",
            }),
        })
    )

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), {
        error: "A valid Crater customer id is required and address must be valid when provided.",
    })
})

test("tax calculation requires a plan", async () => {
    const response = await calculateTax(
        new Request("https://example.com/api/crater/checkout/tax", {
            method: "POST",
            headers: sessionHeaders,
            body: JSON.stringify({}),
        })
    )

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), {
        error: "plan is required.",
    })
})

test("discount validation requires a code", async () => {
    const response = await validateDiscount(
        new Request("https://example.com/api/crater/checkout/discount", {
            method: "POST",
            headers: sessionHeaders,
            body: JSON.stringify({}),
        })
    )

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), {
        error: "code is required.",
    })
})

test("login and discount validation forward documented Crater domain error details", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                usersLogin: {
                    errors: [
                        {
                            errorCode: "INVALID_SAGITTARIUS_TOKEN",
                            details: [{ __typename: "MessageError", message: "The Sagittarius token was rejected." }],
                        },
                    ],
                    userSession: null,
                },
            },
        },
        {
            data: {
                checkoutValidateDiscount: {
                    discount: null,
                    errors: [
                        {
                            errorCode: "INVALID_DISCOUNT_CODE",
                            details: [{ __typename: "ActiveModelError", attribute: "code", type: "inactive" }],
                        },
                    ],
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url
    const originalWarn = console.warn
    const warnings: string[] = []
    console.warn = (message) => warnings.push(String(message))

    try {
        const loginResponse = await createSession(
            new Request("https://example.com/api/crater/login", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ sagittariusToken: "invalid-sagittarius-token" }),
            })
        )
        const discountResponse = await validateDiscount(
            new Request("https://example.com/api/crater/checkout/discount", {
                method: "POST",
                headers: sessionHeaders,
                body: JSON.stringify({ code: "EXPIRED" }),
            })
        )

        assert.equal(loginResponse.status, 422)
        assert.deepEqual(await loginResponse.json(), {
            error: "Crater could not create a user session.",
            errorCode: "INVALID_SAGITTARIUS_TOKEN",
            details: ["The Sagittarius token was rejected."],
        })
        assert.equal(discountResponse.status, 422)
        assert.deepEqual(await discountResponse.json(), {
            error: "Crater could not validate the discount.",
            errorCode: "INVALID_DISCOUNT_CODE",
            details: ["code: inactive"],
        })
        assert.match(graphQLServer.requests[0].body.query ?? "", /fragment CraterErrorFields on Error/)
        assert.match(graphQLServer.requests[1].body.query ?? "", /fragment CraterErrorFields on Error/)
        assert.equal(warnings.length, 1)
        assert.match(warnings[0], /"event":"crater_login_failed"/)
        assert.match(warnings[0], /"errorCode":"INVALID_SAGITTARIUS_TOKEN"/)
        assert.doesNotMatch(warnings[0], /invalid-sagittarius-token|Sagittarius token was rejected/)
    } finally {
        console.warn = originalWarn
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("maps login, customer creation, and customer updates to Crater GraphQL inputs", async () => {
    const graphQLServer = await createGraphQLTestServer([
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
                customersCreate: {
                    errors: [],
                    customer: {
                        id: "gid://crater/Customer/7",
                        customerType: "business",
                        email: "billing@example.com",
                        name: "Example GmbH",
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
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
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

        const createResponse = await createOrGetCustomer(
            new Request("https://example.com/api/crater/customer", {
                method: "POST",
                headers: sessionHeaders,
                body: JSON.stringify({
                    customerType: "business",
                    email: "billing@example.com",
                    name: "Example GmbH",
                    phone: "+49 123",
                    taxIdType: "eu_vat",
                    taxIdValue: "DE123456789",
                }),
            })
        )
        assert.equal(createResponse.status, 201)

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

        assert.equal(graphQLServer.requests.length, 3)
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
                customerType: "business",
                email: "billing@example.com",
                name: "Example GmbH",
                phone: "+49 123",
                taxIdType: "eu_vat",
                taxIdValue: "DE123456789",
            },
        })

        assert.equal(graphQLServer.requests[2].authorization, "Session c_ust_example")
        assert.deepEqual(graphQLServer.requests[2].body.variables, {
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
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("validates a persisted Crater session cookie", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                currentUser: {
                    id: "gid://crater/User/1",
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await getSessionStatus(
            new Request("https://example.com/api/crater/auth/session", {
                headers: { cookie: "crater_session=persisted-token" },
            })
        )

        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { authenticated: true })
        assert.equal(graphQLServer.requests[0].authorization, "Session persisted-token")
        assert.equal(graphQLServer.requests[0].body.operationName, "CraterSessionStatus")
        assert.match(graphQLServer.requests[0].body.query ?? "", /currentUser/)
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("clears a Crater session that has no authenticated user", async () => {
    const graphQLServer = await createGraphQLTestServer([{ data: { currentUser: null } }])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await getSessionStatus(
            new Request("https://example.com/api/crater/auth/session", {
                headers: { cookie: "crater_session=orphaned-token" },
            })
        )

        assert.equal(response.status, 401)
        assert.match(response.headers.get("set-cookie") ?? "", /crater_session=;/)
        assert.match(response.headers.get("set-cookie") ?? "", /Max-Age=0/i)
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("clears a malformed Crater session cookie", async () => {
    const response = await getSessionStatus(
        new Request("https://example.com/api/crater/auth/session", {
            headers: { cookie: "crater_session=token%20with%20spaces" },
        })
    )

    assert.equal(response.status, 401)
    assert.match(response.headers.get("set-cookie") ?? "", /crater_session=;/)
    assert.match(response.headers.get("set-cookie") ?? "", /Max-Age=0/i)
})

test("license dashboard requires a Crater session", async () => {
    const response = await getLicenseDashboard(new Request("https://example.com/api/crater/licenses"))

    assert.equal(response.status, 403)
    assert.equal(response.headers.get("cache-control"), "no-store")
})

test("license dashboard access redirects without exposing the persisted session", async () => {
    const response = await accessLicenseDashboard(
        new Request("https://code0.example/api/crater/licenses/access?locale=de", {
            headers: { cookie: "crater_session=persisted-token" },
        })
    )

    assert.equal(response.status, 307)
    assert.equal(response.headers.get("location"), "https://code0.example/de/licenses")
    assert.equal(response.headers.get("cache-control"), "no-store")
})

test("license dashboard access restores the requested license detail path", async () => {
    const returnPath = "/en/licenses/customer/gid%3A%2F%2Fcrater%2FCustomer%2F35/license/gid%3A%2F%2Fcrater%2FLicense%2F3"
    const response = await accessLicenseDashboard(
        new Request(`https://code0.example/api/crater/licenses/access?locale=en&returnPath=${encodeURIComponent(returnPath)}`, {
            headers: { cookie: "crater_session=persisted-token" },
        })
    )

    assert.equal(response.status, 307)
    assert.equal(response.headers.get("location"), `https://code0.example${returnPath}`)
})

test("license dashboard access rejects return paths outside the localized dashboard", async () => {
    const response = await accessLicenseDashboard(
        new Request("https://code0.example/api/crater/licenses/access?locale=en&returnPath=https%3A%2F%2Fevil.example%2Fphishing", {
            headers: { cookie: "crater_session=persisted-token" },
        })
    )

    assert.equal(response.status, 307)
    assert.equal(response.headers.get("location"), "https://code0.example/en/licenses")
})

test("license dashboard access removes token parameters from its return path", async () => {
    const returnPath = "/en/licenses?token=must-not-survive&view=all"
    const response = await accessLicenseDashboard(
        new Request(`https://code0.example/api/crater/licenses/access?locale=en&returnPath=${encodeURIComponent(returnPath)}`, {
            headers: { cookie: "crater_session=persisted-token" },
        })
    )

    assert.equal(response.status, 307)
    assert.equal(response.headers.get("location"), "https://code0.example/en/licenses?view=all")
})

test("license dashboard loads from the HttpOnly Crater session cookie", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                currentUser: {
                    customers: {
                        edges: [
                            {
                                cursor: "customer-7",
                                node: {
                                    id: "gid://crater/Customer/7",
                                    customerType: "business",
                                    email: "billing@example.com",
                                    name: "Example GmbH",
                                    updatedAt: "2026-08-10T10:00:00Z",
                                    licenses: {
                                        count: 2,
                                        edges: [
                                            {
                                                cursor: "license-1",
                                                node: {
                                                    id: "gid://crater/License/1",
                                                    status: "active",
                                                    plan: "pro",
                                                    deploymentType: "cloud",
                                                    namespaceId: "namespace-1",
                                                    updatedAt: "2026-08-10T10:00:00Z",
                                                },
                                            },
                                            {
                                                cursor: "license-2",
                                                node: {
                                                    id: "gid://crater/License/2",
                                                    status: "active",
                                                    plan: "custom_plan",
                                                    deploymentType: "self_hosted",
                                                    namespaceId: null,
                                                    updatedAt: "2026-08-12T10:00:00Z",
                                                },
                                            },
                                        ],
                                        pageInfo: { endCursor: "license-2", hasNextPage: false },
                                    },
                                },
                            },
                        ],
                        pageInfo: { endCursor: "customer-7", hasNextPage: false },
                    },
                },
            },
        },
        {
            data: {
                currentUser: {
                    customers: {
                        nodes: [
                            {
                                id: "gid://crater/Customer/7",
                                customerType: "business",
                                email: "billing@example.com",
                                name: "Example GmbH",
                                updatedAt: "2026-08-10T10:00:00Z",
                                licenses: {
                                    count: 2,
                                    nodes: [
                                        {
                                            aiTokens: 500000000,
                                            id: "gid://crater/License/1",
                                            status: "active",
                                            plan: "pro",
                                            deploymentType: "cloud",
                                            namespaceId: "namespace-1",
                                            paymentPeriod: "YEARLY",
                                            updatedAt: "2026-08-10T10:00:00Z",
                                            workflowExecutions: 250000,
                                        },
                                        {
                                            aiTokens: 100000000,
                                            id: "gid://crater/License/2",
                                            status: "active",
                                            plan: "custom_plan",
                                            deploymentType: "self_hosted",
                                            namespaceId: null,
                                            paymentPeriod: "MONTHLY",
                                            updatedAt: "2026-08-12T10:00:00Z",
                                            workflowExecutions: 100000,
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await getLicenseDashboard(
            new Request("https://example.com/api/crater/licenses", {
                headers: { cookie: "crater_session=persisted-token" },
            })
        )

        assert.equal(response.status, 200)
        assert.equal(graphQLServer.requests[0].authorization, "Session persisted-token")
        assert.match(response.headers.get("set-cookie") ?? "", /crater_session=persisted-token/)
        assert.equal(graphQLServer.requests[0].body.operationName, "CustomerNavigationPage")
        assert.equal(graphQLServer.requests[1].body.operationName, "LicenseDashboard")
        assert.match(graphQLServer.requests[1].body.query ?? "", /customers\(after: \$customerAfter, first: 25\)/)
        assert.match(graphQLServer.requests[1].body.query ?? "", /licenses\(first: 5\)/)
        assert.deepEqual(await response.json(), {
            customers: [
                {
                    id: "gid://crater/Customer/7",
                    customerType: "business",
                    email: "billing@example.com",
                    name: "Example GmbH",
                    updatedAt: "2026-08-10T10:00:00Z",
                    licenseCount: 2,
                },
            ],
            licenses: [
                {
                    aiTokens: 100000000,
                    customerId: "gid://crater/Customer/7",
                    customerName: "Example GmbH",
                    customerType: "business",
                    id: "gid://crater/License/2",
                    name: "Custom Plan",
                    deploymentType: "self_hosted",
                    paymentPeriod: "MONTHLY",
                    plan: "custom_plan",
                    status: "active",
                    updatedAt: "2026-08-12T10:00:00Z",
                    workflowExecutions: 100000,
                },
                {
                    aiTokens: 500000000,
                    customerId: "gid://crater/Customer/7",
                    customerName: "Example GmbH",
                    customerType: "business",
                    id: "gid://crater/License/1",
                    name: "Pro",
                    deploymentType: "cloud",
                    namespaceId: "namespace-1",
                    paymentPeriod: "YEARLY",
                    plan: "pro",
                    status: "active",
                    updatedAt: "2026-08-10T10:00:00Z",
                    workflowExecutions: 250000,
                },
            ],
            navigationLicenses: [
                {
                    customerId: "gid://crater/Customer/7",
                    customerName: "Example GmbH",
                    customerType: "business",
                    id: "gid://crater/License/2",
                    name: "Custom Plan",
                    deploymentType: "self_hosted",
                    plan: "custom_plan",
                    status: "active",
                    updatedAt: "2026-08-12T10:00:00Z",
                },
                {
                    customerId: "gid://crater/Customer/7",
                    customerName: "Example GmbH",
                    customerType: "business",
                    id: "gid://crater/License/1",
                    name: "Pro",
                    deploymentType: "cloud",
                    namespaceId: "namespace-1",
                    plan: "pro",
                    status: "active",
                    updatedAt: "2026-08-10T10:00:00Z",
                },
            ],
            pagination: { customers: { endCursor: null, hasNextPage: false } },
        })
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("license dashboard navigation includes licenses beyond a customer's first Crater page", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                currentUser: {
                    customers: {
                        edges: [
                            {
                                cursor: "customer-1",
                                node: {
                                    id: "gid://crater/Customer/1",
                                    customerType: "personal",
                                    name: "All Licenses",
                                    licenses: {
                                        count: 26,
                                        edges: [
                                            {
                                                cursor: "license-25",
                                                node: { id: "gid://crater/License/25", plan: "pro", updatedAt: "2026-08-10T10:00:00Z" },
                                            },
                                        ],
                                        pageInfo: { endCursor: "license-25", hasNextPage: true },
                                    },
                                },
                            },
                        ],
                        pageInfo: { endCursor: "customer-1", hasNextPage: false },
                    },
                },
            },
        },
        {
            data: {
                currentUser: {
                    customers: {
                        nodes: [
                            {
                                id: "gid://crater/Customer/1",
                                customerType: "personal",
                                name: "All Licenses",
                                licenses: {
                                    count: 26,
                                    edges: [
                                        {
                                            cursor: "license-26",
                                            node: { id: "gid://crater/License/26", plan: "max", updatedAt: "2026-08-11T10:00:00Z" },
                                        },
                                    ],
                                    pageInfo: { endCursor: "license-26", hasNextPage: false },
                                },
                            },
                        ],
                    },
                },
            },
        },
        {
            data: {
                currentUser: {
                    customers: {
                        count: 1,
                        nodes: [
                            {
                                id: "gid://crater/Customer/1",
                                customerType: "personal",
                                name: "All Licenses",
                                licenses: {
                                    count: 26,
                                    nodes: [{ id: "gid://crater/License/26", plan: "max", updatedAt: "2026-08-11T10:00:00Z" }],
                                },
                            },
                        ],
                        pageInfo: { endCursor: "customer-1", hasNextPage: false },
                    },
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await getLicenseDashboard(new Request("https://example.com/api/crater/licenses", { headers: sessionHeaders }))
        const body = await response.json()

        assert.equal(response.status, 200)
        assert.equal(graphQLServer.requests[0].body.operationName, "CustomerNavigationPage")
        assert.equal(graphQLServer.requests[1].body.operationName, "CustomerLicensePage")
        assert.deepEqual(graphQLServer.requests[1].body.variables, { licenseAfter: "license-25" })
        assert.equal(graphQLServer.requests[2].body.operationName, "LicenseDashboard")
        assert.deepEqual(
            body.navigationLicenses.map((license: { id: string }) => license.id),
            ["gid://crater/License/26", "gid://crater/License/25"]
        )
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("license detail loads lightweight navigation and forwards the invoice cursor", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                currentUser: {
                    customers: {
                        edges: [
                            {
                                cursor: "customer-7",
                                node: {
                                    id: "gid://crater/Customer/7",
                                    customerType: "personal",
                                    email: "first@example.com",
                                    name: "First",
                                    licenses: {
                                        count: 1,
                                        edges: [{ cursor: "license-7", node: { id: "gid://crater/License/7", plan: "pro", updatedAt: "2026-08-10T10:00:00Z" } }],
                                    },
                                },
                            },
                            {
                                cursor: "customer-8",
                                node: {
                                    id: "gid://crater/Customer/8",
                                    customerType: "business",
                                    email: "second@example.com",
                                    name: "Second",
                                    licenses: {
                                        count: 2,
                                        edges: [
                                            { cursor: "license-8a", node: { id: "gid://crater/License/8", plan: "pro", updatedAt: "2026-08-11T10:00:00Z" } },
                                            { cursor: "license-8b", node: { id: "gid://crater/License/9", plan: "custom", updatedAt: "2026-08-12T10:00:00Z" } },
                                        ],
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        },
        {
            data: {
                currentUser: {
                    customers: {
                        nodes: [
                            {
                                id: "gid://crater/Customer/8",
                                customerType: "business",
                                email: "second@example.com",
                                name: "Second",
                                licenses: {
                                    count: 2,
                                    edges: [
                                        { cursor: "license-8a", node: { id: "gid://crater/License/8", plan: "pro", updatedAt: "2026-08-11T10:00:00Z" } },
                                        {
                                            cursor: "license-8b",
                                            node: {
                                                aiTokens: 500000000,
                                                deploymentType: "self_hosted",
                                                id: "gid://crater/License/9",
                                                paymentPeriod: "MONTHLY",
                                                plan: "custom",
                                                status: "paid",
                                                updatedAt: "2026-08-12T10:00:00Z",
                                                workflowExecutions: 250000,
                                                invoices: {
                                                    count: 1,
                                                    nodes: [
                                                        {
                                                            billingPeriodEnd: "2026-09-01T00:00:00Z",
                                                            billingPeriodStart: "2026-08-01T00:00:00Z",
                                                            currency: "eur",
                                                            id: "gid://crater/Invoice/12",
                                                            invoiceNumber: "INV-0012",
                                                            status: "paid",
                                                            stripePdfUrl: "https://pay.stripe.com/invoice/example/pdf",
                                                            total: 13500,
                                                        },
                                                    ],
                                                    pageInfo: { endCursor: "invoice-25", hasNextPage: false },
                                                },
                                            },
                                        },
                                    ],
                                    pageInfo: { endCursor: "license-8b", hasNextPage: false },
                                },
                            },
                        ],
                    },
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await getLicenseDashboard(
            new Request("https://example.com/api/crater/licenses?view=license&customerId=gid%3A%2F%2Fcrater%2FCustomer%2F8&licenseId=gid%3A%2F%2Fcrater%2FLicense%2F9&invoiceAfter=invoice-25", {
                headers: sessionHeaders,
            })
        )
        const body = await response.json()

        assert.equal(response.status, 200)
        assert.equal(graphQLServer.requests[0].body.operationName, "CustomerNavigationPage")
        assert.equal(graphQLServer.requests[1].body.operationName, "LicenseNavigationPage")
        assert.deepEqual(graphQLServer.requests[1].body.variables, { customerAfter: "customer-7", invoiceAfter: "invoice-25" })
        assert.deepEqual(
            body.customers.map((customer: { id: string }) => customer.id),
            ["gid://crater/Customer/8"]
        )
        assert.deepEqual(
            body.licenses.map((license: { id: string }) => license.id),
            ["gid://crater/License/9"]
        )
        assert.deepEqual(body.licenses[0].invoices, [
            {
                billingPeriodEnd: "2026-09-01T00:00:00Z",
                billingPeriodStart: "2026-08-01T00:00:00Z",
                currency: "eur",
                id: "gid://crater/Invoice/12",
                invoiceNumber: "INV-0012",
                status: "paid",
                stripePdfUrl: "https://pay.stripe.com/invoice/example/pdf",
                total: 13500,
            },
        ])
        assert.match(graphQLServer.requests[1].body.query ?? "", /invoices\(after: \$invoiceAfter, first: 25\)/)
        assert.deepEqual(
            body.navigationLicenses.map((license: { id: string }) => license.id),
            ["gid://crater/License/9", "gid://crater/License/8", "gid://crater/License/7"]
        )
        assert.doesNotMatch(graphQLServer.requests[0].body.query ?? "", /aiTokens/)
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("paginates licenses on a customer detail page", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                currentUser: {
                    customers: {
                        edges: [{ cursor: "customer-1", node: { id: "gid://crater/Customer/1", customerType: "personal", licenses: { edges: [] } } }],
                        pageInfo: { endCursor: "customer-1", hasNextPage: false },
                    },
                },
            },
        },
        {
            data: {
                currentUser: {
                    customers: {
                        nodes: [
                            {
                                customerType: "personal",
                                id: "gid://crater/Customer/1",
                                licenses: {
                                    count: 51,
                                    nodes: [{ id: "gid://crater/License/26", plan: "pro" }],
                                    pageInfo: { endCursor: "license-50", hasNextPage: true },
                                },
                            },
                        ],
                    },
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await getLicenseDashboard(
            new Request("https://example.com/api/crater/licenses?view=customer&customerId=gid%3A%2F%2Fcrater%2FCustomer%2F1&licenseAfter=license-25", { headers: sessionHeaders })
        )

        assert.equal(response.status, 200)
        assert.deepEqual(graphQLServer.requests[1].body.variables, { licenseAfter: "license-25" })
        const body = await response.json()
        assert.deepEqual(body.pagination, { licenses: { endCursor: "license-50", hasNextPage: true, totalCount: 51 } })
        assert.deepEqual(
            body.licenses.map((license: { id: string }) => license.id),
            ["gid://crater/License/26"]
        )
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("finds a license customer beyond the first Crater cursor page", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                currentUser: {
                    customers: {
                        edges: [{ cursor: "customer-25", node: { id: "gid://crater/Customer/25", licenses: { edges: [] } } }],
                        pageInfo: { endCursor: "customer-25", hasNextPage: true },
                    },
                },
            },
        },
        {
            data: {
                currentUser: {
                    customers: {
                        edges: [{ cursor: "customer-26", node: { id: "gid://crater/Customer/26", customerType: "business", licenses: { edges: [] } } }],
                        pageInfo: { endCursor: "customer-26", hasNextPage: false },
                    },
                },
            },
        },
        {
            data: {
                currentUser: {
                    customers: {
                        nodes: [
                            {
                                customerType: "business",
                                id: "gid://crater/Customer/26",
                                licenses: { count: 0, nodes: [], pageInfo: { endCursor: null, hasNextPage: false } },
                            },
                        ],
                    },
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await getLicenseDashboard(new Request("https://example.com/api/crater/licenses?view=customer&customerId=gid%3A%2F%2Fcrater%2FCustomer%2F26", { headers: sessionHeaders }))

        assert.equal(response.status, 200)
        assert.equal(graphQLServer.requests[0].body.operationName, "CustomerNavigationPage")
        assert.deepEqual(graphQLServer.requests[1].body.variables, { customerAfter: "customer-25" })
        assert.equal(graphQLServer.requests[2].body.operationName, "LicenseCustomerDetail")
        assert.deepEqual(graphQLServer.requests[2].body.variables, { customerAfter: "customer-25" })
        assert.deepEqual(await response.json(), {
            customers: [{ customerType: "business", id: "gid://crater/Customer/26", licenseCount: 0 }],
            licenses: [],
            navigationLicenses: [],
            pagination: { licenses: { endCursor: null, hasNextPage: false, totalCount: 0 } },
        })
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("links a cloud license to a namespace", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                licensesLinkNamespace: {
                    errors: [],
                    license: {
                        deploymentType: "cloud",
                        id: "gid://crater/License/9",
                        namespaceId: "namespace-9",
                        updatedAt: "2026-08-12T11:00:00Z",
                    },
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await linkLicenseNamespace(
            new Request("https://example.com/api/crater/licenses", {
                method: "PATCH",
                headers: sessionHeaders,
                body: JSON.stringify({ id: "gid://crater/License/9", namespaceId: "namespace-9" }),
            })
        )

        assert.equal(response.status, 200)
        assert.equal(graphQLServer.requests[0].authorization, "Session c_ust_example")
        assert.equal(graphQLServer.requests[0].body.operationName, "LicensesLinkNamespace")
        assert.deepEqual(graphQLServer.requests[0].body.variables, {
            input: { id: "gid://crater/License/9", namespaceId: "namespace-9" },
        })
        assert.deepEqual(await response.json(), {
            deploymentType: "cloud",
            id: "gid://crater/License/9",
            namespaceId: "namespace-9",
            updatedAt: "2026-08-12T11:00:00Z",
        })
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})
