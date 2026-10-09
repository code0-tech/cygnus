import { readGuestCheckoutSession } from "../../src/lib/checkout/guestCheckoutSession"
import assert from "node:assert/strict"
import test, { mock } from "node:test"
import { GET as listCustomers, PATCH as updateCustomer, POST as createOrGetCustomer } from "../../src/app/api/crater/customer/route"
import { POST as createCustomerPaymentMethodSetup } from "../../src/app/api/crater/customer/payment-method-setup/route"
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

const previousServerUrl = process.env.SERVER_URL
test.before(() => {
    process.env.SERVER_URL = "https://code0.example"
})
test.after(() => {
    if (previousServerUrl === undefined) delete process.env.SERVER_URL
    else process.env.SERVER_URL = previousServerUrl
})

let licenseRedirectUrl: string | undefined
mock.module("@/lib/cms", {
    namedExports: { getLicenseContent: async () => ({ redirectUrl: licenseRedirectUrl }) },
})

test("license dashboard access redirects without exposing the persisted session", async () => {
    const response = await accessLicenseDashboard(
        new Request("https://0.0.0.0:3000/api/crater/licenses/access?locale=de", {
            headers: { cookie: "crater_session=persisted-token" },
        })
    )

    assert.equal(response.status, 307)
    assert.equal(response.headers.get("location"), "https://code0.example/de/licenses")
    assert.equal(response.headers.get("cache-control"), "no-store")
})


test("license dashboard access restores the requested license detail path", async () => {
    const returnPath = "/en/licenses/customer/35/license/3"
    const response = await accessLicenseDashboard(
        new Request(`https://0.0.0.0:3000/api/crater/licenses/access?locale=en&returnPath=${encodeURIComponent(returnPath)}`, {
            headers: { cookie: "crater_session=persisted-token" },
        })
    )

    assert.equal(response.status, 307)
    assert.equal(response.headers.get("location"), `https://code0.example${returnPath}`)
})


test("license dashboard access rejects return paths outside the localized dashboard", async () => {
    for (const returnPath of ["https://evil.example/phishing", "//evil.example/en/licenses", "//0.0.0.0:3000/en/licenses", "/en/checkout"]) {
        const response = await accessLicenseDashboard(
            new Request(`https://0.0.0.0:3000/api/crater/licenses/access?locale=en&returnPath=${encodeURIComponent(returnPath)}`, {
                headers: { cookie: "crater_session=persisted-token" },
            })
        )

        assert.equal(response.status, 307)
        assert.equal(response.headers.get("location"), "https://code0.example/en/licenses")
    }
})


test("license dashboard access removes token parameters from its return path", async () => {
    const returnPath = "/en/licenses?token=must-not-survive&view=all"
    const response = await accessLicenseDashboard(
        new Request(`https://0.0.0.0:3000/api/crater/licenses/access?locale=en&returnPath=${encodeURIComponent(returnPath)}`, {
            headers: { cookie: "crater_session=persisted-token" },
        })
    )

    assert.equal(response.status, 307)
    assert.equal(response.headers.get("location"), "https://code0.example/en/licenses?view=all")
})

test("license access resolves anonymous login redirects against the configured public origin", async () => {
    try {
        for (const [redirectUrl, expected] of [
            [undefined, "https://code0.example/de"],
            ["/de/checkout/login", "https://code0.example/de/checkout/login"],
            ["https://app.example/login", "https://app.example/login"],
        ] as const) {
            licenseRedirectUrl = redirectUrl
            const response = await accessLicenseDashboard(new Request("https://0.0.0.0:3000/api/crater/licenses/access?locale=de"))
            assert.equal(response.status, 307)
            assert.equal(response.headers.get("location"), expected)
        }
    } finally {
        licenseRedirectUrl = undefined
    }
})

test("license access opens a purchased snapshot on the public origin after resolving its subscription", async () => {
    const graphQLServer = await createGraphQLTestServer([
        { data: { currentUser: { customers: { edges: [{ cursor: "customer-3", node: { id: "gid://crater/Customer/3" } }], pageInfo: { hasNextPage: false, endCursor: null } } } } },
        { data: { currentUser: { customers: { nodes: [{ id: "gid://crater/Customer/3", subscriptions: { nodes: [{ id: "gid://crater/Subscription/9", currentLicense: { id: "gid://crater/License/7" } }], pageInfo: { hasNextPage: false, endCursor: null } } }] } } } },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const query = new URLSearchParams({ locale: "en", customerId: "gid://crater/Customer/3", licenseId: "gid://crater/License/7" })
        const response = await accessLicenseDashboard(
            new Request(`https://0.0.0.0:3000/api/crater/licenses/access?${query}`, { headers: { cookie: "crater_session=persisted-token" } })
        )
        assert.equal(response.status, 307)
        assert.equal(response.headers.get("location"), "https://code0.example/en/licenses/customer/3/license/9")
        assert.equal(graphQLServer.requests.length, 2)
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
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
                                    subscriptions: {
                                        count: 2,
                                        edges: [
                                            {
                                                cursor: "license-1",
                                                node: {
                                                    id: "gid://crater/Subscription/1",
                                                    status: "ACTIVE",
                                                    currentLicense: { id: "gid://crater/License/1" },
                                                    plan: "PRO",
                                                    deploymentType: "CLOUD",
                                                    namespaceId: "namespace-1",
                                                    updatedAt: "2026-08-10T10:00:00Z",
                                                },
                                            },
                                            {
                                                cursor: "license-2",
                                                node: {
                                                    id: "gid://crater/Subscription/2",
                                                    status: "ACTIVE",
                                                    currentLicense: { id: "gid://crater/License/2" },
                                                    plan: "CUSTOM",
                                                    deploymentType: "SELF_HOSTED",
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
                                subscriptions: {
                                    count: 2,
                                    nodes: [
                                        {
                                            aiTokens: 500000000,
                                            id: "gid://crater/Subscription/1",
                                            status: "ACTIVE",
                                            currentLicense: { id: "gid://crater/License/1" },
                                            plan: "PRO",
                                            deploymentType: "CLOUD",
                                            namespaceId: "namespace-1",
                                            paymentPeriod: "YEARLY",
                                            updatedAt: "2026-08-10T10:00:00Z",
                                            workflowExecutions: 250000,
                                        },
                                        {
                                            aiTokens: 100000000,
                                            id: "gid://crater/Subscription/2",
                                            status: "ACTIVE",
                                            currentLicense: { id: "gid://crater/License/2" },
                                            plan: "CUSTOM",
                                            deploymentType: "SELF_HOSTED",
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
        assert.match(graphQLServer.requests[1].body.query ?? "", /subscriptions\(first: 5\)/)
        assert.deepEqual(await response.json(), {
            customers: [
                {
                    id: "gid://crater/Customer/7",
                    customerType: "business",
                    email: "billing@example.com",
                    name: "Example GmbH",
                    updatedAt: "2026-08-10T10:00:00Z",
                    subscriptionCount: 2,
                },
            ],
            licenses: [
                {
                    aiTokens: 100000000,
                    customerId: "gid://crater/Customer/7",
                    customerName: "Example GmbH",
                    customerType: "business",
                    id: "gid://crater/Subscription/2",
                    licenseId: "gid://crater/License/2",
                    pendingUpdate: null,
                    subscriptionId: "gid://crater/Subscription/2",
                    subscriptionStatus: "ACTIVE",
                    name: "Custom",
                    deploymentType: "self_hosted",
                    paymentPeriod: "monthly",
                    plan: "custom",
                    status: "ACTIVE",
                    updatedAt: "2026-08-12T10:00:00Z",
                    workflowExecutions: 100000,
                },
                {
                    aiTokens: 500000000,
                    customerId: "gid://crater/Customer/7",
                    customerName: "Example GmbH",
                    customerType: "business",
                    id: "gid://crater/Subscription/1",
                    licenseId: "gid://crater/License/1",
                    pendingUpdate: null,
                    subscriptionId: "gid://crater/Subscription/1",
                    subscriptionStatus: "ACTIVE",
                    name: "Pro",
                    deploymentType: "cloud",
                    namespaceId: "namespace-1",
                    paymentPeriod: "yearly",
                    plan: "pro",
                    status: "ACTIVE",
                    updatedAt: "2026-08-10T10:00:00Z",
                    workflowExecutions: 250000,
                },
            ],
            navigationLicenses: [
                {
                    customerId: "gid://crater/Customer/7",
                    customerName: "Example GmbH",
                    customerType: "business",
                    id: "gid://crater/Subscription/2",
                    licenseId: "gid://crater/License/2",
                    pendingUpdate: null,
                    subscriptionId: "gid://crater/Subscription/2",
                    subscriptionStatus: "ACTIVE",
                    name: "Custom",
                    deploymentType: "self_hosted",
                    plan: "custom",
                    status: "ACTIVE",
                    updatedAt: "2026-08-12T10:00:00Z",
                },
                {
                    customerId: "gid://crater/Customer/7",
                    customerName: "Example GmbH",
                    customerType: "business",
                    id: "gid://crater/Subscription/1",
                    licenseId: "gid://crater/License/1",
                    pendingUpdate: null,
                    subscriptionId: "gid://crater/Subscription/1",
                    subscriptionStatus: "ACTIVE",
                    name: "Pro",
                    deploymentType: "cloud",
                    namespaceId: "namespace-1",
                    plan: "pro",
                    status: "ACTIVE",
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
                                    subscriptions: {
                                        count: 26,
                                        edges: [
                                            {
                                                cursor: "license-25",
                                                node: { id: "gid://crater/Subscription/25", plan: "PRO", updatedAt: "2026-08-10T10:00:00Z" },
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
                                subscriptions: {
                                    count: 26,
                                    edges: [
                                        {
                                            cursor: "license-26",
                                            node: { id: "gid://crater/Subscription/26", plan: "MAX", updatedAt: "2026-08-11T10:00:00Z" },
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
                                subscriptions: {
                                    count: 26,
                                    nodes: [{ id: "gid://crater/Subscription/26", plan: "MAX", updatedAt: "2026-08-11T10:00:00Z" }],
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
            ["gid://crater/Subscription/26", "gid://crater/Subscription/25"]
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
                                    subscriptions: {
                                        count: 1,
                                        edges: [{ cursor: "license-7", node: { id: "gid://crater/Subscription/7", plan: "PRO", updatedAt: "2026-08-10T10:00:00Z" } }],
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
                                    subscriptions: {
                                        count: 2,
                                        edges: [
                                            { cursor: "license-8a", node: { id: "gid://crater/Subscription/8", plan: "PRO", updatedAt: "2026-08-11T10:00:00Z" } },
                                            { cursor: "license-8b", node: { id: "gid://crater/Subscription/9", plan: "CUSTOM", updatedAt: "2026-08-12T10:00:00Z" } },
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
                                subscriptions: {
                                    count: 2,
                                    edges: [
                                        { cursor: "license-8a", node: { id: "gid://crater/Subscription/8", plan: "PRO", updatedAt: "2026-08-11T10:00:00Z" } },
                                        {
                                            cursor: "license-8b",
                                            node: {
                                                aiTokens: 500000000,
                                                deploymentType: "SELF_HOSTED",
                                                id: "gid://crater/Subscription/9",
                                                paymentPeriod: "MONTHLY",
                                                plan: "CUSTOM",
                                                status: "ACTIVE",
                                                updatedAt: "2026-08-12T10:00:00Z",
                                                workflowExecutions: 250000,
                                                currentLicense: {
                                                    endDate: "2026-09-01T00:00:00Z",
                                                    id: "gid://crater/License/9",
                                                    invoices: {
                                                        count: 1,
                                                        nodes: [
                                                            {
                                                                createdAt: "2026-08-01T00:00:00Z",
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
            new Request("https://example.com/api/crater/licenses?view=license&customerId=gid%3A%2F%2Fcrater%2FCustomer%2F8&licenseId=gid%3A%2F%2Fcrater%2FSubscription%2F9&invoiceAfter=invoice-25", {
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
            ["gid://crater/Subscription/9"]
        )
        assert.equal(body.licenses[0].endDate, "2026-09-01T00:00:00Z")
        assert.equal(body.licenses[0].licenseId, "gid://crater/License/9")
        assert.equal(body.licenses[0].status, "ACTIVE")
        assert.deepEqual(body.licenses[0].invoices, [
            {
                createdAt: "2026-08-01T00:00:00Z",
                currency: "eur",
                id: "gid://crater/Invoice/12",
                invoiceNumber: "INV-0012",
                status: "paid",
                stripePdfUrl: "https://pay.stripe.com/invoice/example/pdf",
                total: 13500,
            },
        ])
        assert.match(graphQLServer.requests[1].body.query ?? "", /invoices\(after: \$invoiceAfter, first: 25\)/)
        assert.match(graphQLServer.requests[1].body.query ?? "", /endDate/)
        assert.deepEqual(
            body.navigationLicenses.map((license: { id: string }) => license.id),
            ["gid://crater/Subscription/9", "gid://crater/Subscription/8", "gid://crater/Subscription/7"]
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
                        nodes: [
                            {
                                customerType: "personal",
                                id: "gid://crater/Customer/1",
                                subscriptions: {
                                    count: 51,
                                    nodes: [{ id: "gid://crater/Subscription/26", plan: "PRO" }],
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
            new Request("https://example.com/api/crater/licenses?view=customer&customerId=gid%3A%2F%2Fcrater%2FCustomer%2F1&licenseAfter=license-25&includeNavigation=false", {
                headers: sessionHeaders,
            })
        )

        assert.equal(response.status, 200)
        assert.equal(graphQLServer.requests.length, 1)
        assert.equal(graphQLServer.requests[0].body.operationName, "LicenseCustomerDetail")
        assert.deepEqual(graphQLServer.requests[0].body.variables, { licenseAfter: "license-25" })
        const body = await response.json()
        assert.deepEqual(body.pagination, { licenses: { contextCursor: null, endCursor: "license-50", hasNextPage: true, totalCount: 51 } })
        assert.deepEqual(
            body.licenses.map((license: { id: string }) => license.id),
            ["gid://crater/Subscription/26"]
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
                        edges: [{ cursor: "customer-25", node: { id: "gid://crater/Customer/25", subscriptions: { edges: [] } } }],
                        pageInfo: { endCursor: "customer-25", hasNextPage: true },
                    },
                },
            },
        },
        {
            data: {
                currentUser: {
                    customers: {
                        edges: [{ cursor: "customer-26", node: { id: "gid://crater/Customer/26", customerType: "BUSINESS", subscriptions: { edges: [] } } }],
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
                                customerType: "BUSINESS",
                                id: "gid://crater/Customer/26",
                                subscriptions: { count: 0, nodes: [], pageInfo: { endCursor: null, hasNextPage: false } },
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
            customers: [{ customerType: "business", id: "gid://crater/Customer/26", subscriptionCount: 0 }],
            licenses: [],
            navigationLicenses: [],
            pagination: { licenses: { contextCursor: "customer-25", endCursor: null, hasNextPage: false, totalCount: 0 } },
        })
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})


test("links a cloud license through the authenticated namespace selection callback", async () => {
    const graphQLServer = await createGraphQLTestServer([
        {
            data: {
                usersLogin: {
                    errors: [],
                    userSession: {
                        active: true,
                        createdAt: "2026-08-12T10:00:00Z",
                        id: "gid://crater/UserSession/9",
                        token: "namespace-callback-session",
                        updatedAt: "2026-08-12T10:00:00Z",
                    },
                },
            },
        },
        {
            data: {
                subscriptionsLinkNamespace: {
                    errors: [],
                    subscription: {
                        id: "gid://crater/Subscription/9",
                    },
                },
            },
        },
    ])
    const previousGraphQLUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = graphQLServer.url

    try {
        const returnPath = "/en/licenses/customer/3/license/9/edit"
        const response = await selectLicenseNamespace(
            new Request(
                `https://0.0.0.0:3000/api/crater/licenses/namespace/callback?returnPath=${encodeURIComponent(returnPath)}&namespace=${encodeURIComponent("gid://sagittarius/Namespace/9")}&token=sagittarius-secret`
            )
        )

        assert.equal(response.status, 307)
        assert.equal(response.headers.get("location"), `https://code0.example${returnPath}`)
        assert.match(response.headers.get("set-cookie") ?? "", /crater_session=namespace-callback-session/)
        assert.deepEqual(graphQLServer.requests[0].body.variables, {
            input: { sagittariusToken: "sagittarius-secret" },
        })
        assert.equal(graphQLServer.requests[1].authorization, "Session namespace-callback-session")
        assert.equal(graphQLServer.requests[1].body.operationName, "SubscriptionsLinkNamespace")
        assert.deepEqual(graphQLServer.requests[1].body.variables, {
            input: { id: "gid://crater/Subscription/9", namespaceId: "gid://sagittarius/Namespace/9" },
        })
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})


test("license namespace callback requires a namespace selected by Sagittarius", async () => {
    const returnPath = "/de/licenses/customer/3/license/9/edit"
    const response = await selectLicenseNamespace(new Request(`https://0.0.0.0:3000/api/crater/licenses/namespace/callback?returnPath=${encodeURIComponent(returnPath)}&token=sagittarius-secret`))

    assert.equal(response.status, 307)
    assert.equal(response.headers.get("location"), `https://code0.example${returnPath}?namespaceError=selection`)
})


test("license namespace callback rejects return paths that are not exact license routes", async () => {
    for (const returnPath of ["https://evil.example/collect", "//evil.example/en/licenses/customer/3/license/9", "//0.0.0.0:3000/en/licenses/customer/3/license/9", "/en/licenses"]) {
        const response = await selectLicenseNamespace(
            new Request(
                `https://0.0.0.0:3000/api/crater/licenses/namespace/callback?returnPath=${encodeURIComponent(returnPath)}&namespace=${encodeURIComponent("gid://sagittarius/Namespace/9")}&token=sagittarius-secret`
            )
        )

        assert.equal(response.status, 307)
        assert.equal(response.headers.get("location"), "https://code0.example/")
        assert.doesNotMatch(response.headers.get("location") ?? "", /token|namespace/)
    }
})

