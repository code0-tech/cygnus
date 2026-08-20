import assert from "node:assert/strict"
import test from "node:test"
import { InMemoryRateLimiter } from "../src/lib/security/rateLimiter"

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
