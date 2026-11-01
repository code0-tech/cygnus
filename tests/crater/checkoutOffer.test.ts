import assert from "node:assert/strict"
import test from "node:test"
import { NextResponse } from "next/server"
import { POST as sendOffer } from "../../src/app/api/crater/checkout/offer/route"
import { createGuestCheckoutSession } from "../../src/lib/checkout/guestCheckoutSession"
import { withGraphQLServer } from "../helpers/graphqlTestServer"

const customerId = "gid://crater/Customer/3"
const selection = { customerId, deploymentType: "cloud", plan: "custom", paymentPeriod: "yearly", aiTokens: "500000", workflowExecutions: "2000" }

function request(body: unknown, token = "c_ust_offer") {
    return new Request("https://example.com/api/crater/checkout/offer", {
        method: "POST",
        headers: { authorization: `Session ${token}`, "content-type": "application/json" },
        body: JSON.stringify(body),
    })
}

test("sends the checkout selection to Crater as an offer for the entered email", async () => {
    await withGraphQLServer([{ data: { quotesCreate: { errors: [] } } }], async (server) => {
        const response = await sendOffer(request({ ...selection, email: " buyer@example.com " }))

        assert.equal(response.status, 201)
        assert.equal(response.headers.get("cache-control"), "no-store")
        assert.deepEqual(await response.json(), { sent: true })
        assert.equal(server.requests[0].authorization, "Session c_ust_offer")
        assert.equal(server.requests[0].body.operationName, "QuotesCreate")
        assert.deepEqual(server.requests[0].body.variables, {
            input: { customerId, email: "buyer@example.com", plan: "CUSTOM", paymentPeriod: "YEARLY", deploymentType: "CLOUD", aiTokens: 500_000, workflowExecutions: 2_000 },
        })
    })
})

test("forwards Crater's offer error codes", async () => {
    for (const errorCode of ["QUOTE_DELIVERY_FAILED", "INVALID_QUOTE_SELECTION", "INVALID_QUOTE_CUSTOMER"]) {
        await withGraphQLServer([{ data: { quotesCreate: { errors: [{ errorCode, details: [] }] } } }], async () => {
            const response = await sendOffer(request({ ...selection, email: "buyer@example.com" }, `c_ust_offer_${errorCode.toLowerCase()}`))

            assert.equal(response.status, 422)
            assert.equal((await response.json()).errorCode, errorCode)
        })
    }
})

test("refuses incomplete or malformed offers before calling Crater", async () => {
    const cases = [
        { body: { ...selection, email: "not-an-email" }, error: "A valid email is required to send the offer." },
        { body: { ...selection, customerId: "gid://crater/Subscription/3", email: "buyer@example.com" }, error: "customerId is required and must be a valid Crater global ID." },
        { body: { ...selection, deploymentType: "hybrid", email: "buyer@example.com" }, error: "deploymentType must be cloud or self_hosted." },
        { body: { ...selection, plan: "enterprise", email: "buyer@example.com" }, error: "plan must be pro, max, or custom." },
        { body: { ...selection, paymentPeriod: "weekly", email: "buyer@example.com" }, error: "paymentPeriod must be monthly, quarterly, or yearly." },
        { body: { ...selection, aiTokens: "-5", email: "buyer@example.com" }, error: "aiTokens and workflowExecutions must be positive GraphQL integers when provided." },
    ]

    await withGraphQLServer([], async (server) => {
        for (const [index, { body, error }] of cases.entries()) {
            const response = await sendOffer(request(body, `c_ust_offer_invalid_${index}`))
            assert.equal(response.status, 400, error)
            assert.deepEqual(await response.json(), { error })
        }
        assert.equal(server.requests.length, 0)
    })
})

test("every offer sends an email, so a session is limited to five of them", async () => {
    await withGraphQLServer(Array.from({ length: 5 }, () => ({ data: { quotesCreate: { errors: [] } } })), async (server) => {
        const statuses = []
        for (let attempt = 0; attempt < 6; attempt += 1) statuses.push((await sendOffer(request({ ...selection, email: "buyer@example.com" }, "c_ust_offer_limited"))).status)

        assert.deepEqual(statuses, [201, 201, 201, 201, 201, 429])
        assert.equal(server.requests.length, 5)
    })
})

test("a guest offer always goes to the guest checkout's own address", async () => {
    const previousSecret = process.env.PAYLOAD_SECRET
    process.env.PAYLOAD_SECRET = "test-only-offer-guest-secret"
    const checkoutId = "c".repeat(32)
    const guestCookie = createGuestCheckoutSession(NextResponse.json({}), checkoutId, "guest-offer-token", "guest@example.com").headers.getSetCookie()[0].split(";")[0]

    try {
        await withGraphQLServer([{ data: { quotesCreate: { errors: [] } } }], async (server) => {
            const response = await sendOffer(
                new Request("https://example.com/api/crater/checkout/offer", {
                    method: "POST",
                    headers: { cookie: guestCookie, "x-guest-checkout": checkoutId, "content-type": "application/json" },
                    body: JSON.stringify({ ...selection, email: "someone-else@example.com" }),
                })
            )

            assert.equal(response.status, 201)
            assert.equal(server.requests[0].authorization, "Session guest-offer-token")
            assert.equal((server.requests[0].body.variables as { input: { email: string } }).input.email, "guest@example.com")
        })
    } finally {
        if (previousSecret === undefined) delete process.env.PAYLOAD_SECRET
        else process.env.PAYLOAD_SECRET = previousSecret
    }
})
