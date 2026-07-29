import assert from "node:assert/strict"
import test from "node:test"
import { readCraterSessionAuthorization } from "../src/lib/craterSession"

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
