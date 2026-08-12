import assert from "node:assert/strict"
import test from "node:test"
import { GET as listCustomers, PATCH as updateCustomer, POST as createOrGetCustomer } from "../../src/app/api/crater/customer/route"
import { POST as validateDiscount } from "../../src/app/api/crater/checkout/discount/route"
import { POST as calculateTax } from "../../src/app/api/crater/checkout/tax/route"
import { POST as createSession } from "../../src/app/api/crater/login/route"
import { DELETE as deleteSession, GET as getSessionStatus } from "../../src/app/api/crater/auth/session/route"
import { GET as getLicenseDashboard, PATCH as linkLicenseNamespace } from "../../src/app/api/crater/licenses/route"
import { GET as accessLicenseDashboard } from "../../src/app/api/crater/licenses/access/route"
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
        })
        assert.equal(graphQLServer.requests[0].authorization, "Session customer-list-token")
        assert.equal(graphQLServer.requests[0].body.operationName, "CheckoutCustomers")
    } finally {
        if (previousGraphQLUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousGraphQLUrl
        await graphQLServer.close()
    }
})

test("logout clears the persisted Crater session cookie", async () => {
    const response = await deleteSession()

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { authenticated: false })
    assert.match(response.headers.get("set-cookie") ?? "", /crater_session=;/)
    assert.match(response.headers.get("set-cookie") ?? "", /Max-Age=0/i)
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
                        id: "gid://crater/Customer/7",
                        customerType: "business",
                        email: "new@example.com",
                        name: "Updated GmbH",
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
                    address: {
                        city: "Hamburg",
                        country: "DE",
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
                address: {
                    city: "Hamburg",
                    country: "DE",
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

test("license dashboard access forwards the persisted session through the entry URL", async () => {
    const response = await accessLicenseDashboard(
        new Request("https://code0.example/api/crater/licenses/access?locale=de", {
            headers: { cookie: "crater_session=persisted-token" },
        })
    )

    assert.equal(response.status, 307)
    assert.equal(response.headers.get("location"), "https://code0.example/de/licenses?token=persisted-token")
    assert.equal(response.headers.get("cache-control"), "no-store")
})

test("license dashboard does not accept cookie-only access", async () => {
    const response = await getLicenseDashboard(
        new Request("https://example.com/api/crater/licenses", {
            headers: { cookie: "crater_session=persisted-token" },
        })
    )

    assert.equal(response.status, 403)
})

test("license dashboard maps the current user's customers and recent licenses", async () => {
    const graphQLServer = await createGraphQLTestServer([
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
                                            id: "gid://crater/License/1",
                                            status: "active",
                                            plan: "pro",
                                            deploymentType: "cloud",
                                            namespaceId: "namespace-1",
                                            updatedAt: "2026-08-10T10:00:00Z",
                                        },
                                        {
                                            id: "gid://crater/License/2",
                                            status: "active",
                                            plan: "custom_plan",
                                            deploymentType: "self_hosted",
                                            namespaceId: null,
                                            updatedAt: "2026-08-12T10:00:00Z",
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
                headers: {
                    authorization: "Session url-session-token",
                    cookie: "crater_session=stale-cookie-token",
                },
            })
        )

        assert.equal(response.status, 200)
        assert.equal(graphQLServer.requests[0].authorization, "Session url-session-token")
        assert.match(response.headers.get("set-cookie") ?? "", /crater_session=url-session-token/)
        assert.equal(graphQLServer.requests[0].body.operationName, "LicenseDashboard")
        assert.match(graphQLServer.requests[0].body.query ?? "", /customers\(first: 100\)/)
        assert.match(graphQLServer.requests[0].body.query ?? "", /licenses\(first: 100\)/)
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
                    customerId: "gid://crater/Customer/7",
                    customerName: "Example GmbH",
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
                    id: "gid://crater/License/1",
                    name: "Pro",
                    deploymentType: "cloud",
                    namespaceId: "namespace-1",
                    plan: "pro",
                    status: "active",
                    updatedAt: "2026-08-10T10:00:00Z",
                },
            ],
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
