import assert from "node:assert/strict"
import test from "node:test"
import { createRateLimitKey, getTrustedClientIp } from "../src/lib/security/rateLimitKey"

test("selects the client address from the trusted side of a forwarded chain", () => {
    const request = new Request("https://code0.example/api/crater/login", {
        headers: { "x-forwarded-for": "192.0.2.99, 203.0.113.10, 198.51.100.20" },
    })

    assert.equal(getTrustedClientIp(request, { CRATER_RATE_LIMIT_TRUSTED_PROXY_HOPS: "1" }), "198.51.100.20")
    assert.equal(getTrustedClientIp(request, { CRATER_RATE_LIMIT_TRUSTED_PROXY_HOPS: "2" }), "203.0.113.10")
    assert.equal(getTrustedClientIp(request, { CRATER_RATE_LIMIT_TRUSTED_PROXY_HOPS: "4" }), null)
    assert.equal(getTrustedClientIp(request, { CRATER_RATE_LIMIT_TRUSTED_PROXY_HOPS: "0" }), null)
})

test("rejects malformed addresses at the trusted position", () => {
    const malformedForwarded = new Request("https://code0.example", {
        headers: { "x-forwarded-for": "203.0.113.10, attacker-controlled" },
    })
    const malformedRealIp = new Request("https://code0.example", {
        headers: { "x-real-ip": "not-an-ip" },
    })

    assert.equal(getTrustedClientIp(malformedForwarded), null)
    assert.equal(getTrustedClientIp(malformedRealIp), null)
})

test("builds route scoped keys without exposing tokens or addresses", () => {
    const request = new Request("https://code0.example/api/crater/checkout/session", {
        headers: {
            cookie: "crater_session=secret-session-token",
            "x-forwarded-for": "203.0.113.10",
        },
    })
    const checkoutKey = createRateLimitKey("checkout", request)
    const loginKey = createRateLimitKey("login", request)

    assert.match(checkoutKey ?? "", /^checkout:network:[A-Za-z0-9_-]+$/)
    assert.notEqual(checkoutKey, loginKey)
    assert.doesNotMatch(checkoutKey ?? "", /secret-session-token|203\.0\.113\.10/)
})

test("ignores unverified session credentials so random tokens cannot open fresh buckets", () => {
    const request = (headers: Record<string, string>) => new Request("https://code0.example/api/crater/guest", { headers: { "x-forwarded-for": "203.0.113.10", ...headers } })
    const key = createRateLimitKey("guest", request({}))

    assert.equal(createRateLimitKey("guest", request({ authorization: "Session random-one" })), key)
    assert.equal(createRateLimitKey("guest", request({ authorization: "Session random-two" })), key)
    assert.equal(createRateLimitKey("guest", request({ cookie: "crater_session=random-three" })), key)
})

test("returns no key without a trusted client address", () => {
    const request = new Request("https://code0.example/api/crater/login", { headers: { authorization: "Session random-token" } })

    assert.equal(createRateLimitKey("login", request, { CRATER_RATE_LIMIT_TRUSTED_PROXY_HOPS: "1" }), null)
})

test("keeps anonymous clients separated by their trusted address", () => {
    const first = new Request("https://code0.example/api/crater/login", { headers: { "x-forwarded-for": "203.0.113.10" } })
    const second = new Request("https://code0.example/api/crater/login", { headers: { "x-forwarded-for": "203.0.113.11" } })

    assert.notEqual(createRateLimitKey("login", first), createRateLimitKey("login", second))
})
