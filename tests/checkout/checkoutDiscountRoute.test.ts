import assert from "node:assert/strict"
import test from "node:test"
import { POST } from "../../src/app/api/crater/checkout/discount/route"
import { createGraphQLTestServer } from "./graphqlTestServer"

test("selects and returns the complete discount including nullable fields and zero redemptions", async () => {
    const discounts = [
        { amountOff: null, code: "REPEAT", currency: null, duration: "repeating", durationInMonths: 3, maxRedemptions: 100, percentOff: 10, timesRedeemed: 0 },
        { amountOff: 500, code: "FIXED", currency: "eur", duration: "once", durationInMonths: null, maxRedemptions: null, percentOff: null, timesRedeemed: null },
    ]
    const server = await createGraphQLTestServer(discounts.map((discount) => ({ data: { checkoutValidateDiscount: { errors: [], discount } } })))
    const previousUrl = process.env.CRATER_GRAPHQL_URL
    process.env.CRATER_GRAPHQL_URL = server.url
    try {
        for (const discount of discounts) {
            const response = await POST(
                new Request("https://example.com/api/crater/checkout/discount", {
                    method: "POST",
                    headers: { authorization: "Session discount-fields-test", "content-type": "application/json" },
                    body: JSON.stringify({ code: discount.code }),
                })
            )
            assert.equal(response.status, 200)
            assert.deepEqual(await response.json(), discount)
        }
        for (const field of ["durationInMonths", "maxRedemptions", "timesRedeemed"]) {
            assert.match(server.requests[0].body.query ?? "", new RegExp(field))
        }
    } finally {
        if (previousUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
        else process.env.CRATER_GRAPHQL_URL = previousUrl
        await server.close()
    }
})
