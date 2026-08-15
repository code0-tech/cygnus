import assert from "node:assert/strict"
import test from "node:test"
import { readCraterSessionAuthorization } from "@/lib/checkout/craterSession"

test("reads a Crater session token from the Session authorization scheme", () => {
    const request = new Request("https://example.com", {
        headers: {
            authorization: "Session c_ust_example",
        },
    })

    assert.deepEqual(readCraterSessionAuthorization(request), {
        status: "authenticated",
        token: "c_ust_example",
    })
})

test("prefers the HttpOnly Crater session cookie", () => {
    const request = new Request("https://example.com", {
        headers: {
            authorization: "Session header-token",
            cookie: "other=value; crater_session=cookie-token",
        },
    })

    assert.deepEqual(readCraterSessionAuthorization(request), {
        status: "authenticated",
        token: "cookie-token",
    })
})

test("reports a missing authorization header", () => {
    const request = new Request("https://example.com")

    assert.deepEqual(readCraterSessionAuthorization(request), {
        status: "missing",
    })
})

test("rejects Bearer and malformed authorization headers", () => {
    const bearerRequest = new Request("https://example.com", {
        headers: {
            authorization: "Bearer c_ust_example",
        },
    })
    const malformedRequest = new Request("https://example.com", {
        headers: {
            authorization: "Session token with spaces",
        },
    })

    assert.deepEqual(readCraterSessionAuthorization(bearerRequest), {
        status: "invalid",
    })
    assert.deepEqual(readCraterSessionAuthorization(malformedRequest), {
        status: "invalid",
    })
})

test("can require the URL-provided authorization header instead of the session cookie", () => {
    const request = new Request("https://example.com", {
        headers: {
            authorization: "Session url-session-token",
            cookie: "crater_session=cookie-token",
        },
    })

    assert.deepEqual(readCraterSessionAuthorization(request, true), {
        status: "authenticated",
        token: "url-session-token",
    })
    assert.deepEqual(readCraterSessionAuthorization(new Request("https://example.com", { headers: { cookie: "crater_session=cookie-token" } }), true), {
        status: "missing",
    })
})
