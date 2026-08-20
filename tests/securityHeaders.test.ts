import assert from "node:assert/strict"
import test from "node:test"
import { createContentSecurityPolicy } from "../next.config"

test("production CSP permits Stripe Elements without broadly permitting external scripts", () => {
    const policy = createContentSecurityPolicy(false)

    assert.match(policy, /default-src 'self'/)
    assert.match(policy, /script-src 'self' 'unsafe-inline' https:\/\/\*\.stripe\.com/)
    assert.match(policy, /frame-src[^;]*https:\/\/\*\.stripe\.com/)
    assert.match(policy, /connect-src[^;]*https:\/\/\*\.stripe\.com[^;]*https:\/\/\*\.stripe\.network[^;]*https:\/\/\*\.link\.com/)
    assert.match(policy, /object-src 'none'/)
    assert.match(policy, /upgrade-insecure-requests/)
    assert.doesNotMatch(policy, /script-src[^;]*\s\*($|\s|;)/)
    assert.doesNotMatch(policy, /unsafe-eval/)
})

test("development CSP permits Next.js hot reload without weakening production", () => {
    const policy = createContentSecurityPolicy(true)

    assert.match(policy, /connect-src 'self' ws: wss:/)
    assert.match(policy, /script-src[^;]*'unsafe-eval'/)
    assert.doesNotMatch(policy, /upgrade-insecure-requests/)
})
