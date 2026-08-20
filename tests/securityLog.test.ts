import assert from "node:assert/strict"
import test from "node:test"
import { logSecurityEvent } from "../src/lib/security/securityLog"

test("writes structured security events without request secrets", () => {
    const originalWarn = console.warn
    const messages: string[] = []
    console.warn = (message) => messages.push(String(message))

    try {
        logSecurityEvent({ event: "rate_limit_exceeded", policy: "login", limit: 5, retryAfterSeconds: 60, scope: "anonymous" })
    } finally {
        console.warn = originalWarn
    }

    assert.equal(messages.length, 1)
    const event = JSON.parse(messages[0]) as Record<string, unknown>
    assert.equal(event.event, "rate_limit_exceeded")
    assert.equal(event.policy, "login")
    assert.equal(event.limit, 5)
    assert.equal(event.retryAfterSeconds, 60)
    assert.equal(event.scope, "anonymous")
    assert.match(String(event.timestamp), /^\d{4}-\d{2}-\d{2}T/)
    assert.deepEqual(Object.keys(event).sort(), ["event", "limit", "policy", "retryAfterSeconds", "scope", "timestamp"].sort())
})
