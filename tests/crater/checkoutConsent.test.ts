import assert from "node:assert/strict"
import test from "node:test"
import { NextResponse } from "next/server"
import { POST as verifyConsents } from "../../src/app/api/crater/checkout/consent/route"
import { createGuestCheckoutSession } from "../../src/lib/checkout/guestCheckoutSession"
import { missingConsents, requiredConsents } from "../../src/lib/crater/consents.server"
import { withGraphQLServer } from "../helpers/graphqlTestServer"

const customerId = "gid://crater/Customer/3"

function request(body: unknown, token: string) {
    return new Request("https://example.com/api/crater/checkout/consent", {
        method: "POST",
        headers: { authorization: `Session ${token}`, "content-type": "application/json" },
        body: JSON.stringify(body),
    })
}

function customerPage(customers: Array<{ id: string; customerType: string }>, pageInfo = { endCursor: null as string | null, hasNextPage: false }) {
    return { data: { currentUser: { customers: { nodes: customers, pageInfo } } } }
}

test("personal customers need the terms and the withdrawal consent, business customers only the terms", () => {
    assert.deepEqual(requiredConsents("personal"), ["terms", "withdrawal"])
    assert.deepEqual(requiredConsents("business"), ["terms"])
    assert.deepEqual(requiredConsents(undefined), ["terms", "withdrawal"])
    assert.deepEqual(missingConsents({ consents: { terms: true, withdrawal: true } }, "personal"), [])
    assert.deepEqual(missingConsents({ consents: { terms: true } }, "business"), [])
    for (const consents of [undefined, null, [], "true", { terms: "true", withdrawal: 1 }]) {
        assert.deepEqual(missingConsents({ consents } as never, "personal"), ["terms", "withdrawal"])
    }
})

test("accepts the pay step once the consents the customer's Crater type requires are given", async () => {
    for (const [index, { customerType, consents }] of [
        { customerType: "PERSONAL", consents: { terms: true, withdrawal: true } },
        { customerType: "BUSINESS", consents: { terms: true, withdrawal: false } },
    ].entries()) {
        await withGraphQLServer([customerPage([{ id: customerId, customerType }])], async (server) => {
            const response = await verifyConsents(request({ customerId, consents }, `c_ust_consent_ok_${index}`))
            assert.equal(response.status, 200)
            assert.equal(response.headers.get("cache-control"), "no-store")
            assert.deepEqual(await response.json(), { accepted: true })
            assert.equal(server.requests[0].body.operationName, "CheckoutCustomers")
        })
    }
})

test("refuses the pay step when a required consent is missing, whatever the client claims about the customer", async () => {
    const cases = [
        { customerType: "PERSONAL", body: { consents: { terms: true }, customerType: "business" }, missing: ["withdrawal"] },
        { customerType: "PERSONAL", body: {}, missing: ["terms", "withdrawal"] },
        { customerType: "BUSINESS", body: { consents: { withdrawal: true } }, missing: ["terms"] },
    ]
    for (const [index, { customerType, body, missing }] of cases.entries()) {
        await withGraphQLServer([customerPage([{ id: customerId, customerType }])], async () => {
            const response = await verifyConsents(request({ customerId, ...body }, `c_ust_consent_missing_${index}`))
            assert.equal(response.status, 400)
            assert.deepEqual(await response.json(), { error: "The required consents were not given.", errorCode: "MISSING_CONSENT", missing })
        })
    }
})

test("looks the customer up across pages and refuses unknown customers and sessions", async () => {
    await withGraphQLServer(
        [customerPage([{ id: "gid://crater/Customer/1", customerType: "BUSINESS" }], { endCursor: "next", hasNextPage: true }), customerPage([{ id: customerId, customerType: "BUSINESS" }])],
        async (server) => {
            assert.equal((await verifyConsents(request({ customerId, consents: { terms: true } }, "c_ust_consent_paged"))).status, 200)
            assert.deepEqual(server.requests[1].body.variables, { after: "next" })
        }
    )
    for (const { responses, status } of [
        { responses: [customerPage([{ id: "gid://crater/Customer/1", customerType: "BUSINESS" }])], status: 404 },
        { responses: [{ data: { currentUser: null } }], status: 401 },
    ]) {
        await withGraphQLServer(responses, async () => {
            assert.equal((await verifyConsents(request({ customerId, consents: { terms: true, withdrawal: true } }, `c_ust_consent_${status}`))).status, status)
        })
    }
})

test("rejects requests without a session or a valid customer id before contacting Crater", async () => {
    await withGraphQLServer([], async (server) => {
        const anonymous = await verifyConsents(
            new Request("https://example.com/api/crater/checkout/consent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ customerId }) })
        )
        assert.equal(anonymous.status, 403)
        for (const body of [{}, { customerId: "gid://crater/Subscription/1" }, { customerId: 3 }]) {
            assert.equal((await verifyConsents(request(body, "c_ust_consent_invalid"))).status, 400)
        }
        assert.equal(server.requests.length, 0)
    })
})

test("guest checkouts may verify their consents", async () => {
    const previousSecret = process.env.PAYLOAD_SECRET
    process.env.PAYLOAD_SECRET = "test-only-consent-guest-secret"
    const checkoutId = "d".repeat(32)
    const guestCookie = createGuestCheckoutSession(NextResponse.json({}), checkoutId, "guest-consent-token", "guest@example.com").headers.getSetCookie()[0].split(";")[0]

    try {
        await withGraphQLServer([customerPage([{ id: customerId, customerType: "PERSONAL" }])], async (server) => {
            const response = await verifyConsents(
                new Request("https://example.com/api/crater/checkout/consent", {
                    method: "POST",
                    headers: { cookie: guestCookie, "x-guest-checkout": checkoutId, "content-type": "application/json" },
                    body: JSON.stringify({ customerId, consents: { terms: true, withdrawal: true } }),
                })
            )
            assert.equal(response.status, 200)
            assert.equal(server.requests[0].authorization, "Session guest-consent-token")
        })
    } finally {
        if (previousSecret === undefined) delete process.env.PAYLOAD_SECRET
        else process.env.PAYLOAD_SECRET = previousSecret
    }
})
