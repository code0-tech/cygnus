import assert from "node:assert/strict"
import test, { mock } from "node:test"
import { CheckoutSubmissionError, createCheckoutSession } from "../../src/lib/checkout/client"

test("checkout errors preserve structured diagnostics without appending them to the message", async () => {
    const fetchMock = mock.method(globalThis, "fetch", async () => Response.json({
        error: "Backend message", errorCode: "RATE_LIMITED", details: ["Internal detail", 42],
    }, { status: 429, headers: { "Retry-After": "42" } }))
    try {
        await assert.rejects(createCheckoutSession({ customerId: "customer-1", locale: "en", searchParams: new URLSearchParams() }), (error: unknown) => {
            assert.ok(error instanceof CheckoutSubmissionError)
            assert.equal(error.kind, "session")
            assert.equal(error.message, "Backend message")
            assert.equal(error.errorCode, "RATE_LIMITED")
            assert.deepEqual(error.details, ["Internal detail"])
            assert.equal(error.status, 429)
            assert.equal(error.retryAfterSeconds, 42)
            return true
        })
    } finally {
        fetchMock.mock.restore()
    }
})
