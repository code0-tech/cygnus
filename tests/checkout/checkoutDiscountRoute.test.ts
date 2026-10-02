import assert from "node:assert/strict"
import test from "node:test"
import { POST } from "../../src/app/api/crater/checkout/discount/route"
import { createGraphQLTestServer } from "./graphqlTestServer"

test("retired discount validation returns 410 without calling Crater", async () => {
    const server = await createGraphQLTestServer([])
    const previousUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = server.url
    try {
        const response = await POST(new Request("https://example.com/api/crater/checkout/discount", {
            method: "POST",
            headers: { authorization: "Session discount-test", "content-type": "application/json" },
            body: JSON.stringify({ code: "SAVE10" }),
        }))
        assert.equal(response.status, 410)
        assert.equal(response.headers.get("cache-control"), "no-store")
        assert.deepEqual(server.requests, [])
    } finally {
        if (previousUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousUrl
        await server.close()
    }
})
