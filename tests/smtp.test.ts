import assert from "node:assert/strict"
import test from "node:test"
import { createRateLimitChecker, escapeHtml, getClientIdentifier, getRateLimitConfig } from "@/lib/smtp"

test("escapes html-sensitive characters", () => {
    assert.equal(escapeHtml(`<a href="x">It's ok & safe</a>`), "&lt;a href=&quot;x&quot;&gt;It&#039;s ok &amp; safe&lt;/a&gt;")
})

test("uses forwarded IP before real IP", () => {
    const request = new Request("https://example.com", {
        headers: {
            "x-forwarded-for": "203.0.113.10, 203.0.113.11",
            "x-real-ip": "198.51.100.1",
        },
    })

    assert.equal(getClientIdentifier(request), "203.0.113.10")
})

test("falls back invalid rate limit env values", () => {
    const previousMax = process.env.TEST_RATE_LIMIT_MAX
    const previousWindow = process.env.TEST_RATE_LIMIT_WINDOW
    process.env.TEST_RATE_LIMIT_MAX = "-1"
    process.env.TEST_RATE_LIMIT_WINDOW = "nope"

    try {
        assert.deepEqual(getRateLimitConfig("TEST_RATE_LIMIT_MAX", "TEST_RATE_LIMIT_WINDOW", 3, 20), {
            max: 3,
            windowMs: 20_000,
        })
    } finally {
        process.env.TEST_RATE_LIMIT_MAX = previousMax
        process.env.TEST_RATE_LIMIT_WINDOW = previousWindow
    }
})

test("blocks requests after configured max within window", () => {
    const checkRateLimit = createRateLimitChecker({ max: 2, windowMs: 60_000 })

    assert.deepEqual(checkRateLimit("client"), { allowed: true, retryAfterSeconds: 0 })
    assert.deepEqual(checkRateLimit("client"), { allowed: true, retryAfterSeconds: 0 })

    const blocked = checkRateLimit("client")
    assert.equal(blocked.allowed, false)
    assert.equal(blocked.retryAfterSeconds > 0, true)
})
