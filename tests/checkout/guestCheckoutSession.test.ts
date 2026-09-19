import assert from "node:assert/strict"
import test from "node:test"
import { NextResponse } from "next/server"
import { createGuestCheckoutSession, readGuestCheckoutSession, completeGuestCheckoutSession, GUEST_CHECKOUT_TTL_MS } from "../../src/lib/checkout/guestCheckoutSession"
import { readCraterSessionAuthorization, clearCraterSessionCookie } from "../../src/lib/checkout/craterSession"
import { POST as exportLicense } from "../../src/app/api/crater/licenses/export/route"
import { GET as checkoutStatus } from "../../src/app/api/crater/checkout/status/route"
import { POST as createCustomer } from "../../src/app/api/crater/customer/route"
import { createGraphQLTestServer } from "./graphqlTestServer"

const id = "a".repeat(32)
const secondId = "b".repeat(32)
const licenseId = "gid://crater/License/9"
const sessionId = "cs_test_abcdef123"

function cookie(response: NextResponse) {
    return response.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; ")
}

function request(cookies: string, path = "/api/crater/customer", purchase = id, method = "GET") {
    return new Request(`https://example.com${path}`, { method, headers: { cookie: `crater_session=account-token; ${cookies}`, "x-guest-checkout": purchase } })
}

test("guest purchase isolation, expiry and completion", async (t) => {
    const previous = process.env.PAYLOAD_SECRET
    process.env.PAYLOAD_SECRET = "test-only-guest-checkout-secret"
    try {
        const response = createGuestCheckoutSession(NextResponse.json({}), id, "guest-token", "claim-token", "guest@example.com")
        const cookies = cookie(response)

        await t.test("account and simultaneous purchases keep separate credentials", () => {
            const second = cookie(createGuestCheckoutSession(NextResponse.json({}), secondId, "second-token"))
            assert.deepEqual(readCraterSessionAuthorization(request(`${cookies}; ${second}`)), { status: "authenticated", token: "guest-token" })
            assert.deepEqual(readCraterSessionAuthorization(request(`${cookies}; ${second}`, undefined, secondId)), { status: "authenticated", token: "second-token" })
            assert.deepEqual(readCraterSessionAuthorization(new Request("https://example.com/api/crater/licenses", { headers: { cookie: `crater_session=account-token; ${cookies}` } })), {
                status: "authenticated",
                token: "account-token",
            })
            assert.doesNotMatch(response.headers.get("set-cookie")!, /Max-Age|Expires|guest-token|claim-token/)
        })

        await t.test("missing, malformed and tampered guest credentials never fall back to the account", () => {
            for (const candidate of [request(""), request(cookies, undefined, "invalid"), request(cookies.replace(/=./, (value) => (value === "=X" ? "=Y" : "=X")))]) {
                assert.deepEqual(readCraterSessionAuthorization(candidate), { status: "invalid" })
            }
            assert.deepEqual(readCraterSessionAuthorization(request(cookies, "/api/crater/licenses")), { status: "invalid" })
        })

        await t.test("expiry is absolute and clearing a guest leaves the account cookies alone", () => {
            const now = Date.now
            const current = Date.now()
            Date.now = () => current + GUEST_CHECKOUT_TTL_MS + 1
            try {
                assert.equal(readGuestCheckoutSession(request(cookies)), null)
                const cleared = clearCraterSessionCookie(NextResponse.json({}), request(cookies))
                assert.equal(cleared.headers.getSetCookie().length, 1)
                assert.match(cleared.headers.get("set-cookie")!, /Max-Age=0/)
                assert.doesNotMatch(cleared.headers.get("set-cookie")!, /crater_session=|crater_user_login=/)
            } finally {
                Date.now = now
            }
        })

        await t.test("completion drops the claim and limits access to the receipt and its license", async () => {
            const completed = completeGuestCheckoutSession(NextResponse.json({}), request(cookies), sessionId, licenseId)
            const receiptCookies = cookie(completed)
            const receipt = readGuestCheckoutSession(request(receiptCookies))!
            assert.equal(receipt.claimToken, undefined)
            assert.equal(receipt.email, undefined)
            assert.ok(receipt.expiresAt <= Date.now() + 30 * 60 * 1000)
            assert.deepEqual(readCraterSessionAuthorization(request(receiptCookies)), { status: "invalid" })
            assert.deepEqual(readCraterSessionAuthorization(request(receiptCookies, `/api/crater/checkout/status?sessionId=${sessionId}`)), { status: "authenticated", token: "guest-token" })
            assert.deepEqual(readCraterSessionAuthorization(request(receiptCookies, "/api/crater/checkout/status?sessionId=cs_test_other")), { status: "invalid" })
            const invalidExport = new Request(request(receiptCookies, "/api/crater/licenses/export", id, "POST"), { body: JSON.stringify({ id: "gid://crater/License/10" }) })
            assert.equal((await exportLicense(invalidExport)).status, 403)
            assert.equal(completeGuestCheckoutSession(NextResponse.json({}), request(receiptCookies), sessionId, licenseId).headers.get("set-cookie"), null)
        })

        await t.test("customer creation uses the guest email instead of a different submitted email", async () => {
            const server = await createGraphQLTestServer([
                { data: { customersCreate: { customer: { id: "gid://crater/Customer/1", customerType: "PERSONAL", email: "guest@example.com", name: "Guest" }, errors: [] } } },
            ])
            const previousUrl = process.env.CRATER_GRAPHQL_URL
            process.env.CRATER_GRAPHQL_URL = server.url
            try {
                const result = await createCustomer(new Request(request(cookies, "/api/crater/customer", id, "POST"), {
                    body: JSON.stringify({ customerType: "personal", email: "different@example.com", name: "Guest", address: { country: "DE", city: "Berlin" } }),
                }))
                assert.equal(result.status, 201)
                assert.equal((server.requests[0].body.variables as { input: { email: string } }).input.email, "guest@example.com")
            } finally {
                if (previousUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
                else process.env.CRATER_GRAPHQL_URL = previousUrl
                await server.close()
            }
        })

        await t.test("verified READY response replaces checkout access with receipt access", async () => {
            const server = await createGraphQLTestServer([
                { data: { checkoutCompletionStatus: { state: "READY", customerId: "gid://crater/Customer/1", licenseId, configuration: null, pricing: null } } },
            ])
            const previousUrl = process.env.CRATER_GRAPHQL_URL
            process.env.CRATER_GRAPHQL_URL = server.url
            try {
                const result = await checkoutStatus(request(cookies, `/api/crater/checkout/status?sessionId=${sessionId}`))
                assert.equal(result.status, 200)
                assert.equal(server.requests[0].authorization, "Session guest-token")
                assert.equal(readGuestCheckoutSession(request(cookie(result)))?.receipt?.licenseId, licenseId)
            } finally {
                if (previousUrl === undefined) delete process.env.CRATER_GRAPHQL_URL
                else process.env.CRATER_GRAPHQL_URL = previousUrl
                await server.close()
            }
        })
    } finally {
        if (previous === undefined) delete process.env.PAYLOAD_SECRET
        else process.env.PAYLOAD_SECRET = previous
    }
})
