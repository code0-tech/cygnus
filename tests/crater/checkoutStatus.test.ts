import assert from "node:assert/strict"
import test from "node:test"
import { GET as getCheckoutLicenseStatus } from "../../src/app/api/crater/checkout/status/route"
import { withGraphQLServer } from "../helpers/graphqlTestServer"
import { NextResponse } from "next/server"
import { createGuestCheckoutSession } from "../../src/lib/checkout/guestCheckoutSession"

const sessionHeaders = {
    authorization: "Session c_ust_example",
    "content-type": "application/json",
}

test("checkout status has a separate per-session budget for polling, including guests", async (t) => {
    for (const [key, value] of Object.entries({
        PAYLOAD_SECRET: "test-checkout-status-cookie-secret",
        CRATER_CHECKOUT_STATUS_RATE_LIMIT_MAX: "2",
        CRATER_CHECKOUT_STATUS_RATE_LIMIT_WINDOW_SECONDS: "60",
    })) {
        const previous = process.env[key]
        process.env[key] = value
        t.after(() => {
            if (previous === undefined) delete process.env[key]
            else process.env[key] = previous
        })
    }
    const pending = { data: { checkoutCompletionStatus: { state: "FULFILLMENT_PENDING", customerId: "gid://crater/Customer/1", licenseId: null, configuration: null, pricing: null } } }
    const guestId = "a".repeat(32)
    const cookie = createGuestCheckoutSession(new NextResponse(), guestId, "status-guest-session").headers.getSetCookie()[0].split(";")[0]
    const headers = { cookie, "x-guest-checkout": guestId, "x-forwarded-for": "203.0.113.60" }
    const request = (sessionId: string, requestHeaders = headers) => new Request(`https://example.com/api/crater/checkout/status?sessionId=${sessionId}`, { headers: requestHeaders })

    await withGraphQLServer([pending, pending, pending], async (server) => {
        // Unauthenticated and malformed requests never spend the polling budget or reach Crater.
        assert.equal((await getCheckoutLicenseStatus(request("cs_test_first123", { ...headers, cookie: "" }))).status, 401)
        assert.equal((await getCheckoutLicenseStatus(request("invalid"))).status, 400)
        assert.equal((await getCheckoutLicenseStatus(request("cs_test_first123"))).status, 200)
        assert.equal((await getCheckoutLicenseStatus(request("cs_test_first123"))).status, 200)

        // Neither changing the checkout id nor the network address resets a session's budget.
        const limited = await getCheckoutLicenseStatus(request("cs_test_other123", { ...headers, "x-forwarded-for": "203.0.113.61" }))
        assert.equal(limited.status, 429)
        assert.equal(limited.headers.get("retry-after"), "60")
        assert.equal(limited.headers.get("cache-control"), "no-store")
        assert.equal(server.requests.length, 2)

        // A different session on the same address keeps its own allowance.
        assert.equal((await getCheckoutLicenseStatus(new Request("https://example.com/api/crater/checkout/status?sessionId=cs_test_first123", {
            headers: { authorization: "Session status-other-session", "x-forwarded-for": "203.0.113.60" },
        }))).status, 200)
        assert.deepEqual(server.requests.map(request => request.authorization), ["Session status-guest-session", "Session status-guest-session", "Session status-other-session"])
    })
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
    // Crater answers with its enums; the route hands the success page the lowercase values back.
    const craterConfiguration = {
        aiTokens: null,
        customerType: "BUSINESS",
        deploymentType: "CLOUD",
        paymentPeriod: "MONTHLY",
        plan: "PRO",
        workflowExecutions: null,
    }
    const configuration = { ...craterConfiguration, customerType: "business", deploymentType: "cloud", paymentPeriod: "monthly", plan: "pro" }
    const pricing = { currency: "eur", discount: 1_000, subtotal: 10_000, tax: 1_710, total: 10_710 }
    await withGraphQLServer([
        {
            data: {
                checkoutCompletionStatus: {
                    state: "PAYMENT_PENDING",
                    customerId,
                    licenseId: null,
                    configuration: craterConfiguration,
                    pricing,
                },
            },
        },
        {
            data: {
                checkoutCompletionStatus: {
                    state: "READY",
                    customerId,
                    licenseId: "gid://crater/License/2",
                    configuration: craterConfiguration,
                    pricing,
                },
            },
        },
    ], async (graphQLServer) => {
        const requestUrl = `https://example.com/api/crater/checkout/status?sessionId=${sessionId}`
        const pendingResponse = await getCheckoutLicenseStatus(new Request(requestUrl, { headers: sessionHeaders }))
        const readyResponse = await getCheckoutLicenseStatus(new Request(requestUrl, { headers: sessionHeaders }))

        assert.equal(pendingResponse.status, 200)
        assert.deepEqual(await pendingResponse.json(), { state: "PAYMENT_PENDING", customerId, licenseId: null, configuration, pricing })
        assert.equal(readyResponse.status, 200)
        assert.deepEqual(await readyResponse.json(), { state: "READY", customerId, licenseId: "gid://crater/License/2", configuration, pricing })
        assert.equal(graphQLServer.requests[0].body.operationName, "CheckoutCompletionStatus")
        assert.deepEqual(graphQLServer.requests[0].body.variables, { sessionId })
        assert.match(graphQLServer.requests[0].body.query ?? "", /checkoutCompletionStatus\(sessionId: \$sessionId\)/)
        assert.match(graphQLServer.requests[0].body.query ?? "", /configuration\s*\{/)
        assert.match(graphQLServer.requests[0].body.query ?? "", /pricing\s*\{/)
        assert.doesNotMatch(graphQLServer.requests[0].body.query ?? "", /currentUser|createdAt/)
    })
})

test("checkout completion status remains available while optional pricing is not ready", async () => {
    const customerId = "gid://crater/Customer/1"
    await withGraphQLServer([
        {
            data: {
                checkoutCompletionStatus: {
                    state: "FULFILLMENT_PENDING",
                    customerId,
                    licenseId: null,
                    configuration: null,
                    pricing: null,
                },
            },
        },
    ], async (graphQLServer) => {
        const response = await getCheckoutLicenseStatus(new Request("https://example.com/api/crater/checkout/status?sessionId=cs_test_checkout123", { headers: sessionHeaders }))

        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), {
            state: "FULFILLMENT_PENDING",
            customerId,
            licenseId: null,
            configuration: null,
            pricing: null,
        })
    })
})

test("checkout completion status does not expose foreign or inconsistent sessions", async () => {
    await withGraphQLServer([
        {
            errors: [
                {
                    message: "Invalid checkout status session",
                    extensions: { errorCode: "INVALID_CHECKOUT_STATUS_SESSION" },
                },
            ],
        },
    ], async (graphQLServer) => {
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
    })
})

test("checkout completion status marks temporary Crater status failures as retryable", async () => {
    await withGraphQLServer([
        {
            errors: [
                {
                    message: "Stripe unavailable",
                    extensions: { errorCode: "CHECKOUT_STATUS_UNAVAILABLE" },
                },
            ],
        },
    ], async (graphQLServer) => {
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
    })
})

