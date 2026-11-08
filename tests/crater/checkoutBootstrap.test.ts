import assert from "node:assert/strict"
import test from "node:test"
import { GET as bootstrapCheckout } from "../../src/app/api/crater/checkout/bootstrap/route"
import { withGraphQLServer } from "../helpers/graphqlTestServer"

test("checkout bootstrap requires a Crater session", async () => {
    const response = await bootstrapCheckout(new Request("https://example.com/api/crater/checkout/bootstrap"))
    assert.equal(response.status, 403)
})

test("checkout bootstrap validates the session and returns the first customer page in one Crater query", async () => {
    await withGraphQLServer(
        [
            {
                data: {
                    currentUser: {
                        customers: {
                            nodes: [{ id: "gid://crater/Customer/1", customerType: "PERSONAL", email: "ada@example.com", name: "Ada" }],
                            pageInfo: { endCursor: "customer-50", hasNextPage: true },
                        },
                    },
                },
            },
        ],
        async (graphQLServer) => {
            const response = await bootstrapCheckout(new Request("https://example.com/api/crater/checkout/bootstrap", { headers: { authorization: "Session bootstrap-token" } }))

            assert.equal(response.status, 200)
            assert.deepEqual(await response.json(), {
                authenticated: true,
                customers: [{ id: "gid://crater/Customer/1", customerType: "personal", email: "ada@example.com", name: "Ada" }],
                pageInfo: { endCursor: "customer-50", hasNextPage: true },
            })
            assert.equal(graphQLServer.requests.length, 1)
            assert.equal(graphQLServer.requests[0].authorization, "Session bootstrap-token")
            assert.equal(graphQLServer.requests[0].body.operationName, "CheckoutCustomers")
        }
    )
})

test("checkout bootstrap rejects a session Crater resolves no user for and clears the session cookie", async () => {
    await withGraphQLServer([{ data: { currentUser: null } }], async () => {
        const response = await bootstrapCheckout(new Request("https://example.com/api/crater/checkout/bootstrap", { headers: { cookie: "crater_session=expired-token" } }))

        assert.equal(response.status, 401)
        assert.match(response.headers.get("set-cookie") ?? "", /crater_session=;/)
    })
})
