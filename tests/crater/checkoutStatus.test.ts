import { readGuestCheckoutSession } from "../../src/lib/checkout/guestCheckoutSession"
import assert from "node:assert/strict"
import test from "node:test"
import { GET as listCustomers, PATCH as updateCustomer, POST as createOrGetCustomer } from "../../src/app/api/crater/customer/route"
import { GET as getCustomerPaymentMethodSetupStatus, POST as createCustomerPaymentMethodSetup } from "../../src/app/api/crater/customer/payment-method-setup/route"
import { GET as getCustomerPaymentMethods } from "../../src/app/api/crater/customer/payment-methods/route"
import { POST as createCheckoutSession } from "../../src/app/api/crater/checkout/session/route"
import { POST as createGuestUser } from "../../src/app/api/crater/guest/route"
import { POST as createSession } from "../../src/app/api/crater/login/route"
import { DELETE as deleteSession, GET as getSessionStatus } from "../../src/app/api/crater/auth/session/route"
import { GET as completeCraterLogin } from "../../src/app/api/crater/auth/callback/route"
import { GET as getLicenseDashboard } from "../../src/app/api/crater/licenses/route"
import { GET as accessLicenseDashboard } from "../../src/app/api/crater/licenses/access/route"
import { GET as selectLicenseNamespace } from "../../src/app/api/crater/licenses/namespace/callback/route"
import { GET as getCheckoutLicenseStatus } from "../../src/app/api/crater/checkout/status/route"
import { createGraphQLTestServer } from "../helpers/graphqlTestServer"

// CustomerAddressCreateInput declares all six fields non-null; the optional line2 and state are forwarded as empty strings.
const FULL_ADDRESS = { city: "Berlin", country: "DE", line1: "HauptstraÃŸe 1", postalCode: "10115" }
const FORWARDED_ADDRESS = { ...FULL_ADDRESS, line2: "", state: "" }

const sessionHeaders = {
    authorization: "Session c_ust_example",
    "content-type": "application/json",
}

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
    const graphQLServer = await createGraphQLTestServer([
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
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
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
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})


test("checkout completion status remains available while optional pricing is not ready", async () => {
    const customerId = "gid://crater/Customer/1"
    const graphQLServer = await createGraphQLTestServer([
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
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await getCheckoutLicenseStatus(new Request("https://example.com/api/crater/checkout/status?sessionId=cs_test_checkout123", { headers: sessionHeaders }))

        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), {
            state: "FULFILLMENT_PENDING",
            customerId,
            licenseId: null,
            configuration: null,
            pricing: null,
        })
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

