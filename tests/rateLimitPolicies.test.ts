import assert from "node:assert/strict"
import test from "node:test"
import { getRateLimitPolicy } from "../src/lib/security/rateLimitPolicies"

test("defines separate defaults for sensitive Crater routes", () => {
    assert.deepEqual(getRateLimitPolicy("login", {}), { max: 5, windowSeconds: 600 })
    assert.deepEqual(getRateLimitPolicy("checkout", {}), { max: 20, windowSeconds: 600 })
    assert.deepEqual(getRateLimitPolicy("checkoutStatus", {}), { max: 120, windowSeconds: 60 })
    assert.deepEqual(getRateLimitPolicy("guest", {}), { max: 5, windowSeconds: 600 })
})

test("accepts positive integer overrides and rejects unsafe values", () => {
    assert.deepEqual(
        getRateLimitPolicy("login", {
            CRATER_LOGIN_RATE_LIMIT_MAX: "8",
            CRATER_LOGIN_RATE_LIMIT_WINDOW_SECONDS: "120",
        }),
        { max: 8, windowSeconds: 120 }
    )
    assert.deepEqual(
        getRateLimitPolicy("checkout", {
            CRATER_CHECKOUT_RATE_LIMIT_MAX: "0",
            CRATER_CHECKOUT_RATE_LIMIT_WINDOW_SECONDS: "not-a-number",
        }),
        { max: 20, windowSeconds: 600 }
    )
})

test("keeps the original env names of the form routes", () => {
    assert.deepEqual(getRateLimitPolicy("contact", {}), { max: 5, windowSeconds: 600 })
    assert.deepEqual(getRateLimitPolicy("jobApplication", {}), { max: 5, windowSeconds: 600 })
    assert.deepEqual(getRateLimitPolicy("contact", { CONTACT_RATE_LIMIT_MAX: "2", CONTACT_RATE_LIMIT_WINDOW_SECONDS: "30" }), { max: 2, windowSeconds: 30 })
    assert.deepEqual(getRateLimitPolicy("jobApplication", { JOBS_RATE_LIMIT_MAX: "3", JOBS_RATE_LIMIT_WINDOW_SECONDS: "45" }), { max: 3, windowSeconds: 45 })
})
