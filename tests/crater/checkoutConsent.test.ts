import assert from "node:assert/strict"
import test from "node:test"
import { NextResponse } from "next/server"
import { POST as recordConsent } from "../../src/app/api/crater/checkout/consent/route"
import { createGuestCheckoutSession } from "../../src/lib/checkout/guestCheckoutSession"
import { withGraphQLServer } from "../helpers/graphqlTestServer"

const sessionId = "cs_test_a1B2c3D4e5"

function request(body: unknown, token: string) {
    return new Request("https://example.com/api/crater/checkout/consent", {
        method: "POST",
        headers: { authorization: `Session ${token}`, "content-type": "application/json" },
        body: JSON.stringify(body),
    })
}

function recorded(stripeCheckoutSessionId = sessionId) {
    return { data: { checkoutRecordConsent: { consent: { stripeCheckoutSessionId }, errors: [] } } }
}

function rejected(errorCode: string, message: string) {
    return { data: { checkoutRecordConsent: { consent: null, errors: [{ errorCode, details: [{ __typename: "MessageError", message }] }] } } }
}

test("records the consents in Crater for exactly the given checkout session", async () => {
    for (const [index, { consents, termsVersion, input }] of [
        { consents: { terms: true, withdrawal: true }, termsVersion: undefined, input: { sessionId, terms: true, withdrawal: true } },
        // A business checkout sends no withdrawal; Crater decides it is not required.
        { consents: { terms: true }, termsVersion: undefined, input: { sessionId, terms: true } },
        { consents: { terms: true, withdrawal: false }, termsVersion: "2026-11-01", input: { sessionId, terms: true, withdrawal: false, termsVersion: "2026-11-01" } },
    ].entries()) {
        await withGraphQLServer([recorded()], async (server) => {
            const response = await recordConsent(request({ sessionId, consents, termsVersion }, `c_ust_consent_ok_${index}`))
            assert.equal(response.status, 200)
            assert.equal(response.headers.get("cache-control"), "no-store")
            assert.deepEqual(await response.json(), { recorded: true })
            assert.equal(server.requests.length, 1)
            assert.equal(server.requests[0].body.operationName, "CheckoutRecordConsent")
            assert.deepEqual(server.requests[0].body.variables, { input })
            assert.equal(server.requests[0].authorization, `Session c_ust_consent_ok_${index}`)
        })
    }
})

test("validates nothing itself: an unticked consent is forwarded and Crater's refusal is surfaced with its code", async () => {
    await withGraphQLServer([rejected("MISSING_CHECKOUT_CONSENT", "withdrawal")], async (server) => {
        const response = await recordConsent(request({ sessionId, consents: { terms: true, withdrawal: false } }, "c_ust_consent_missing"))
        assert.equal(response.status, 422)
        assert.deepEqual(await response.json(), { error: "Crater did not record the checkout consents.", errorCode: "MISSING_CHECKOUT_CONSENT", details: ["withdrawal"] })
        assert.deepEqual(server.requests[0].body.variables, { input: { sessionId, terms: true, withdrawal: false } })
    })
    await withGraphQLServer([rejected("INVALID_CHECKOUT_CONSENT_SESSION", "Checkout session is no longer open")], async () => {
        const response = await recordConsent(request({ sessionId, consents: { terms: true } }, "c_ust_consent_closed"))
        assert.equal(response.status, 422)
        assert.equal((await response.json()).errorCode, "INVALID_CHECKOUT_CONSENT_SESSION")
    })
})

test("never reports success without a stored consent for the same session", async () => {
    for (const [index, payload] of [
        recorded("cs_test_someOtherSession"),
        { data: { checkoutRecordConsent: { consent: null, errors: [] } } },
        { data: { checkoutRecordConsent: null } },
        { data: null, errors: [{ message: "Internal server error" }] },
    ].entries()) {
        await withGraphQLServer([payload], async () => {
            const response = await recordConsent(request({ sessionId, consents: { terms: true } }, `c_ust_consent_broken_${index}`))
            assert.equal(response.status, 502)
            assert.equal((await response.json()).recorded, undefined)
        })
    }
})

test("rejects requests without a session or a valid checkout session before contacting Crater", async () => {
    await withGraphQLServer([], async (server) => {
        const anonymous = await recordConsent(
            new Request("https://example.com/api/crater/checkout/consent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId, consents: { terms: true } }) })
        )
        assert.equal(anonymous.status, 403)
        for (const body of [
            {},
            { consents: { terms: true } },
            { sessionId: "gid://crater/Customer/1", consents: { terms: true } },
            { sessionId: "pi_123456789", consents: { terms: true } },
            { sessionId, consents: { terms: "true" } },
            { sessionId, consents: { terms: true, withdrawal: 1 } },
            { sessionId, consents: [] },
            { sessionId, consents: { terms: true }, termsVersion: "v".repeat(101) },
        ]) {
            assert.equal((await recordConsent(request(body, "c_ust_consent_invalid"))).status, 400, JSON.stringify(body))
        }
        assert.equal(server.requests.length, 0)
    })
})

test("guest checkouts record their consents with the guest's Crater session", async () => {
    const previousSecret = process.env.PAYLOAD_SECRET
    process.env.PAYLOAD_SECRET = "test-only-consent-guest-secret"
    const checkoutId = "d".repeat(32)
    const guestCookie = createGuestCheckoutSession(NextResponse.json({}), checkoutId, "guest-consent-token", "guest@example.com").headers.getSetCookie()[0].split(";")[0]

    try {
        await withGraphQLServer([recorded()], async (server) => {
            const response = await recordConsent(
                new Request("https://example.com/api/crater/checkout/consent", {
                    method: "POST",
                    headers: { cookie: guestCookie, "x-guest-checkout": checkoutId, "content-type": "application/json" },
                    body: JSON.stringify({ sessionId, consents: { terms: true, withdrawal: true } }),
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
