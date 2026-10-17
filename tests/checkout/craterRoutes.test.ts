import assert from "node:assert/strict"
import test from "node:test"
import { PATCH as updateCustomer, POST as createOrGetCustomer } from "../../src/app/api/crater/customer/route"
import { POST as validateDiscount } from "../../src/app/api/crater/checkout/discount/route"
import { POST as calculateTax } from "../../src/app/api/crater/checkout/tax/route"
import { POST as createSession } from "../../src/app/api/crater/login/route"
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

test("business customer creation requires tax ID fields", async () => {
    const response = await createOrGetCustomer(
        new Request("https://example.com/api/crater/customer", {
            method: "POST",
            headers: sessionHeaders,
            body: JSON.stringify({
                customerType: "business",
                email: "company@example.com",
                name: "Example Company",
            }),
        })
    )

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), {
        error: "taxIdType and taxIdValue are required for business customers.",
    })
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
