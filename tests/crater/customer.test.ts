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
                address: FULL_ADDRESS,
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


test("customer payment methods carry the display details Crater resolves for every id", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                currentUser: {
                    customers: {
                        nodes: [{ id: "gid://crater/Customer/1", paymentMethods: ["pm_card", "pm_unavailable"] }],
                        pageInfo: { endCursor: null, hasNextPage: false },
                    },
                },
            },
        },
        { data: { paymentMethod: { brand: "visa", expiresMonth: 12, expiresYear: 2030, last4: "4242", type: "card" } } },
        { data: { paymentMethod: null } },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const response = await getCustomerPaymentMethods(
            new Request("https://example.com/api/crater/customer/payment-methods?customerId=gid%3A%2F%2Fcrater%2FCustomer%2F1", {
                headers: sessionHeaders,
            })
        )

        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), {
            paymentMethods: [
                { id: "pm_card", brand: "visa", expiresMonth: 12, expiresYear: 2030, last4: "4242", type: "card" },
                { id: "pm_unavailable", brand: null, expiresMonth: null, expiresYear: null, last4: null, type: null },
            ],
        })
        assert.equal(response.headers.get("cache-control"), "no-store")
        assert.deepEqual(
            graphQLServer.requests.slice(1).map((request) => request.body.operationName),
            ["CustomerPaymentMethod", "CustomerPaymentMethod"]
        )
        assert.deepEqual(
            graphQLServer.requests.slice(1).map((request) => request.body.variables),
            [{ paymentMethodId: "pm_card" }, { paymentMethodId: "pm_unavailable" }]
        )
        for (const request of graphQLServer.requests.slice(1)) {
            assert.match(request.body.query ?? "", /paymentMethod\(paymentMethodId:/)
            assert.doesNotMatch(request.body.query ?? "", /customerPaymentMethod\(/)
        }
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
                                customerType: "PERSONAL",
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
                        nodes: [{ customerType: "BUSINESS", id: "gid://crater/Customer/51" }],
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


test("customer creation sends the CustomerType enum and nothing Crater no longer accepts", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                customersCreate: {
                    errors: [],
                    customer: {
                        id: "gid://crater/Customer/1",
                        customerType: "BUSINESS",
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
                body: JSON.stringify({
                    checkoutKey: "3f456ad7-c94b-4a63-aea2-17bd9dcf65be",
                    customerType: "business",
                    name: "Example",
                    email: "a@example.com",
                    address: FULL_ADDRESS,
                    draft: true,
                    reuseExisting: false,
                }),
            })
        )

        assert.equal(response.status, 201)
        assert.equal(graphQLServer.requests[0].authorization, "Session c_ust_example")
        assert.deepEqual(graphQLServer.requests[0].body.variables, { input: { customerType: "BUSINESS", name: "Example", email: "a@example.com", address: FORWARDED_ADDRESS } })
        assert.deepEqual(await response.json(), {
            id: "gid://crater/Customer/1",
            customerType: "business",
            email: null,
            name: null,
        })
        assert.doesNotMatch(graphQLServer.requests[0].body.query ?? "", /status/)
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})


test("customer creation forwards the required address and optional phone and tax ID", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                customersCreate: {
                    errors: [],
                    customer: {
                        id: "gid://crater/Customer/2",
                        customerType: "PERSONAL",
                        email: "ada@example.com",
                        name: "Ada Lovelace",
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
                body: JSON.stringify({
                    address: { city: "London", country: "GB", line1: "1 Main Street", postalCode: "E1 6AN" },
                    customerType: "personal",
                    email: "ada@example.com",
                    name: "Ada Lovelace",
                    phone: "+44 20 7946 0958",
                    taxIdType: "eu_vat",
                    taxIdValue: "DE123456789",
                }),
            })
        )

        assert.equal(response.status, 201)
        assert.deepEqual(graphQLServer.requests[0].body.variables, {
            input: {
                address: { city: "London", country: "GB", line1: "1 Main Street", line2: "", postalCode: "E1 6AN", state: "" },
                customerType: "PERSONAL",
                email: "ada@example.com",
                name: "Ada Lovelace",
                phone: "+44 20 7946 0958",
                taxIdType: "eu_vat",
                taxIdValue: "DE123456789",
            },
        })
        assert.equal(((await response.json()) as { customerType: string }).customerType, "personal")
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})


test("customer creation requires the customer type Crater cannot infer", async () => {
    const invalidBodies = [
        { email: "billing@example.com", name: "Example GmbH" },
        { customerType: "unknown" },
        { customerType: "personal" },
        { customerType: "personal", name: "Ada", email: "ada@example.com" },
        { customerType: "personal", name: "Ada", email: "ada@example.com", address: {} },
        { customerType: "personal", name: " ", email: "ada@example.com", address: FULL_ADDRESS },
        { customerType: "personal", name: "Ada", email: "invalid", address: FULL_ADDRESS },
        { customerType: "personal", name: "Ada", email: "ada@example.com", address: { country: "DE" } },
        { address: "1 Main Street", customerType: "business" },
    ]

    for (const body of invalidBodies) {
        const response = await createOrGetCustomer(
            new Request("https://example.com/api/crater/customer", {
                method: "POST",
                headers: sessionHeaders,
                body: JSON.stringify(body),
            })
        )

        assert.equal(response.status, 400)
        assert.deepEqual(await response.json(), {
            error: "customerType, name, a valid email, and an address with line1, city, postalCode, and country are required.",
        })
    }
})


test("customer creation rejects incomplete tax ID fields", async () => {
    const response = await createOrGetCustomer(
        new Request("https://example.com/api/crater/customer", {
            method: "POST",
            headers: sessionHeaders,
            body: JSON.stringify({ customerType: "business", name: "Example", email: "a@example.com", address: FULL_ADDRESS, taxIdType: "eu_vat" }),
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
                    address: FULL_ADDRESS,
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


test("checkout enforces its route limit", async () => {
    const environmentKeys = [
        "CRATER_CHECKOUT_RATE_LIMIT_MAX",
        "CRATER_CHECKOUT_RATE_LIMIT_WINDOW_SECONDS",
        "CRATER_RATE_LIMIT_TRUSTED_PROXY_HOPS",
    ] as const
    const previousEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]))

    process.env.CRATER_CHECKOUT_RATE_LIMIT_MAX = "1"
    process.env.CRATER_CHECKOUT_RATE_LIMIT_WINDOW_SECONDS = "90"
    process.env.CRATER_RATE_LIMIT_TRUSTED_PROXY_HOPS = "1"

    const request = (path: string) =>
        new Request(`https://example.com${path}`, {
            method: "POST",
            headers: {
                authorization: "Session c_ust_route_limit_test",
                "content-type": "application/json",
                "x-forwarded-for": "192.0.2.241",
            },
            body: JSON.stringify({}),
        })

    const originalWarn = console.warn
    const warnings: string[] = []
    console.warn = (message) => warnings.push(String(message))

    try {
        assert.equal((await createCheckoutSession(request("/api/crater/checkout/session"))).status, 400)

        const limitedResponses = [await createCheckoutSession(request("/api/crater/checkout/session"))]

        for (const response of limitedResponses) {
            assert.equal(response.status, 429)
            assert.equal(response.headers.get("retry-after"), "90")
            assert.equal(response.headers.get("ratelimit-limit"), "1")
            assert.equal(response.headers.get("ratelimit-remaining"), "0")
        }

        assert.deepEqual(warnings.map((message) => (JSON.parse(message) as { policy: string }).policy).sort(), ["checkout"])
    } finally {
        console.warn = originalWarn
        for (const key of environmentKeys) {
            const previousValue = previousEnvironment[key]
            if (previousValue === undefined) delete process.env[key]
            else process.env[key] = previousValue
        }
    }
})


test("login forwards documented Crater domain error details", async () => {
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
        assert.equal(loginResponse.status, 422)
        assert.deepEqual(await loginResponse.json(), {
            error: "Crater could not create a user session.",
            errorCode: "INVALID_SAGITTARIUS_TOKEN",
            details: ["The Sagittarius token was rejected."],
        })
        assert.match(graphQLServer.requests[0].body.query ?? "", /fragment CraterErrorFields on Error/)
        assert.equal(graphQLServer.requests.length, 1)
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

