import assert from "node:assert/strict"
import test from "node:test"
import { NextRequest } from "next/server"
import { createContentSecurityPolicy } from "../src/lib/security/contentSecurityPolicy"
import { proxy } from "../src/proxy"

test("production CSP permits Stripe Elements and only nonce-authorized inline scripts", () => {
    const policy = createContentSecurityPolicy("test-nonce", false)

    assert.match(policy, /default-src 'self'/)
    assert.match(policy, /script-src 'self' 'nonce-test-nonce' 'strict-dynamic' https:\/\/\*\.stripe\.com/)
    assert.match(policy, /frame-src[^;]*https:\/\/\*\.stripe\.com/)
    assert.match(policy, /connect-src[^;]*https:\/\/\*\.stripe\.com[^;]*https:\/\/\*\.stripe\.network[^;]*https:\/\/\*\.link\.com/)
    assert.match(policy, /object-src 'none'/)
    assert.match(policy, /upgrade-insecure-requests/)
    assert.doesNotMatch(policy, /script-src[^;]*\s\*($|\s|;)/)
    assert.doesNotMatch(policy, /script-src[^;]*unsafe-inline/)
    assert.doesNotMatch(policy, /unsafe-eval/)
})

test("development CSP permits Next.js hot reload without weakening production", () => {
    const policy = createContentSecurityPolicy("test-nonce", true)

    assert.match(policy, /connect-src 'self' ws: wss:/)
    assert.match(policy, /script-src[^;]*'unsafe-eval'/)
    assert.doesNotMatch(policy, /upgrade-insecure-requests/)
})

test("proxy generates a fresh nonce and sends the same policy to Next.js and the browser", () => {
    const firstResponse = proxy(new NextRequest("https://code0.example/de/checkout"))
    const secondResponse = proxy(new NextRequest("https://code0.example/de/checkout"))
    const firstPolicy = firstResponse.headers.get("content-security-policy") ?? ""
    const secondPolicy = secondResponse.headers.get("content-security-policy") ?? ""

    assert.match(firstPolicy, /'nonce-[A-Za-z0-9+/]+=*'/)
    assert.notEqual(firstPolicy, secondPolicy)
    assert.equal(firstResponse.headers.get("x-middleware-next"), "1")
    assert.equal(firstResponse.headers.get("x-middleware-request-content-security-policy"), firstPolicy)
    assert.match(firstResponse.headers.get("x-middleware-request-x-nonce") ?? "", /^[A-Za-z0-9+/]+=*$/)
})

test("proxy keeps locale redirects and secures Payload admin pages", () => {
    const redirectResponse = proxy(new NextRequest("https://code0.example/pricing"))
    const adminResponse = proxy(new NextRequest("https://code0.example/admin"))

    assert.equal(redirectResponse.headers.get("location"), "https://code0.example/en/pricing")
    assert.ok(redirectResponse.headers.has("content-security-policy"))
    assert.equal(adminResponse.headers.get("x-middleware-next"), "1")
    assert.ok(adminResponse.headers.has("content-security-policy"))
})
