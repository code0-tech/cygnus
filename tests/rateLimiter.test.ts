import assert from "node:assert/strict"
import test from "node:test"
import { enforceRateLimit, InMemoryRateLimiter } from "../src/lib/security/rateLimiter"

test("blocks requests after the configured fixed-window limit", () => {
    let now = 1_000
    const limiter = new InMemoryRateLimiter(100, () => now)
    const policy = { max: 2, windowSeconds: 60 }

    assert.deepEqual(limiter.consume("login:key", policy), { allowed: true, limit: 2, remaining: 1, resetSeconds: 60, shouldLog: false })
    assert.deepEqual(limiter.consume("login:key", policy), { allowed: true, limit: 2, remaining: 0, resetSeconds: 60, shouldLog: false })
    assert.deepEqual(limiter.consume("login:key", policy), { allowed: false, limit: 2, remaining: 0, resetSeconds: 60, shouldLog: true })
    assert.deepEqual(limiter.consume("login:key", policy), { allowed: false, limit: 2, remaining: 0, resetSeconds: 60, shouldLog: false })

    now += 60_000
    assert.deepEqual(limiter.consume("login:key", policy), { allowed: true, limit: 2, remaining: 1, resetSeconds: 60, shouldLog: false })
})

test("keeps keys independent and evicts old buckets at the memory bound", () => {
    const limiter = new InMemoryRateLimiter(2, () => 1_000)
    const policy = { max: 1, windowSeconds: 60 }

    assert.equal(limiter.consume("first", policy).allowed, true)
    assert.equal(limiter.consume("second", policy).allowed, true)
    assert.equal(limiter.consume("third", policy).allowed, true)
    assert.equal(limiter.consume("first", policy).allowed, true)
})

test("limits requests without a trusted address through a shared, larger bucket", () => {
    const previousMax = process.env.CRATER_CHECKOUT_RATE_LIMIT_MAX
    const previousProxyHops = process.env.CRATER_RATE_LIMIT_TRUSTED_PROXY_HOPS
    const originalWarn = console.warn
    const warnings: Array<Record<string, unknown>> = []
    console.warn = (message) => warnings.push(JSON.parse(String(message)) as Record<string, unknown>)
    process.env.CRATER_CHECKOUT_RATE_LIMIT_MAX = "1"
    process.env.CRATER_RATE_LIMIT_TRUSTED_PROXY_HOPS = "1"

    const request = (sessionToken: string) => new Request("https://code0.example/api/crater/checkout/session", { headers: { authorization: `Session ${sessionToken}` } })

    try {
        for (let index = 0; index < 10; index += 1) assert.equal(enforceRateLimit("checkout", request(`random-${index}`)), null)

        const rejected = enforceRateLimit("checkout", request("random-final"))
        assert.equal(rejected?.status, 429)
        assert.equal(rejected?.headers.get("ratelimit-limit"), "10")
        assert.deepEqual(
            warnings.map(({ event, policy, network }) => ({ event, policy, network })),
            [
                { event: "rate_limit_untrusted_network", policy: "checkout", network: undefined },
                { event: "rate_limit_exceeded", policy: "checkout", network: "untrusted" },
            ]
        )
    } finally {
        console.warn = originalWarn
        if (previousMax === undefined) delete process.env.CRATER_CHECKOUT_RATE_LIMIT_MAX
        else process.env.CRATER_CHECKOUT_RATE_LIMIT_MAX = previousMax
        if (previousProxyHops === undefined) delete process.env.CRATER_RATE_LIMIT_TRUSTED_PROXY_HOPS
        else process.env.CRATER_RATE_LIMIT_TRUSTED_PROXY_HOPS = previousProxyHops
    }
})

function withEnvironment(values: Record<string, string>, run: () => void) {
    const environment = process.env as Record<string, string | undefined>
    const previous = Object.fromEntries(Object.keys(values).map((key) => [key, environment[key]]))
    Object.assign(environment, values)
    try {
        run()
    } finally {
        for (const [key, value] of Object.entries(previous)) {
            if (value === undefined) delete environment[key]
            else environment[key] = value
        }
    }
}

function silenceSecurityLog(run: () => void) {
    const originalWarn = console.warn
    const originalError = console.error
    console.warn = () => {}
    console.error = () => {}
    try {
        run()
    } finally {
        console.warn = originalWarn
        console.error = originalError
    }
}

const untrustedRequest = () => new Request("https://code0.example/api/crater/guest", { method: "POST" })

test("keys untrusted requests by subject so one hammered subject leaves the shared bucket intact", () => {
    withEnvironment({ CRATER_GUEST_RATE_LIMIT_MAX: "2", CRATER_RATE_LIMIT_TRUSTED_PROXY_HOPS: "1" }, () =>
        silenceSecurityLog(() => {
            assert.equal(enforceRateLimit("guest", untrustedRequest(), "hammered@example.com"), null)
            assert.equal(enforceRateLimit("guest", untrustedRequest(), " Hammered@Example.com "), null)
            for (let index = 0; index < 30; index += 1) {
                const rejected = enforceRateLimit("guest", untrustedRequest(), "hammered@example.com")
                assert.equal(rejected?.status, 429)
                assert.equal(rejected?.headers.get("ratelimit-limit"), "2")
            }

            // Shared bucket (2 × 10) has only lost the two allowed requests above.
            assert.equal(enforceRateLimit("guest", untrustedRequest(), "other@example.com"), null)
            assert.equal(enforceRateLimit("guest", untrustedRequest(), "other@example.com"), null)
        })
    )
})

test("stops opening subject buckets once the shared untrusted bucket is exhausted", () => {
    withEnvironment({ CRATER_LOGIN_RATE_LIMIT_MAX: "1", CRATER_RATE_LIMIT_TRUSTED_PROXY_HOPS: "1" }, () =>
        silenceSecurityLog(() => {
            for (let index = 0; index < 10; index += 1) assert.equal(enforceRateLimit("login", untrustedRequest(), `subject-${index}`), null)

            const rejected = enforceRateLimit("login", untrustedRequest(), "fresh-subject")
            assert.equal(rejected?.status, 429)
            assert.equal(rejected?.headers.get("ratelimit-limit"), "10")
        })
    )
})

test("reports every untrusted request as an error in production", () => {
    const originalError = console.error
    const errors: Array<Record<string, unknown>> = []
    console.error = (message) => errors.push(JSON.parse(String(message)) as Record<string, unknown>)

    try {
        withEnvironment({ NODE_ENV: "production", CRATER_RATE_LIMIT_TRUSTED_PROXY_HOPS: "1" }, () => {
            enforceRateLimit("checkout", untrustedRequest())
            enforceRateLimit("checkout", untrustedRequest())
        })
    } finally {
        console.error = originalError
    }

    assert.deepEqual(
        errors.map(({ event, policy }) => ({ event, policy })),
        [
            { event: "rate_limit_untrusted_network", policy: "checkout" },
            { event: "rate_limit_untrusted_network", policy: "checkout" },
        ]
    )
})

test("reports a bucket as exhausted only while its window is open and full", () => {
    let now = 1_000
    const limiter = new InMemoryRateLimiter(100, () => now)
    const policy = { max: 1, windowSeconds: 60 }

    assert.equal(limiter.isExhausted("key", policy), false)
    limiter.consume("key", policy)
    assert.equal(limiter.isExhausted("key", policy), true)
    now += 60_000
    assert.equal(limiter.isExhausted("key", policy), false)
})
