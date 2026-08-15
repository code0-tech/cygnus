import assert from "node:assert/strict"
import test from "node:test"
import { createCheckoutQuery, createCraterLoginCallbackUrl, createMainAppLoginUrl } from "../../src/lib/checkout/checkoutLogin"

test("preserves the subscription configuration for guest checkout", () => {
    const query = createCheckoutQuery({ plan: "custom", tag: ["one", "two"], token: "secret", authError: "session", empty: undefined })

    assert.equal(query, "plan=custom&tag=one&tag=two")
})

test("routes the Sagittarius login response through the server-side Crater callback", () => {
    const result = createCraterLoginCallbackUrl(new URL("https://code0.example"), "/de/checkout?plan=custom")

    assert.equal(result, "https://code0.example/api/crater/auth/callback?returnPath=%2Fde%2Fcheckout%3Fplan%3Dcustom")
})

test("appends the absolute checkout and cancellation URLs to the configured login URL", () => {
    const result = createMainAppLoginUrl("https://app.example/login?source=pricing", "https://code0.example/de/checkout?plan=custom", "https://code0.example/de/subscription?plan=custom")

    assert.equal(
        result,
        "https://app.example/login?source=pricing&callbackUrl=https%3A%2F%2Fcode0.example%2Fde%2Fcheckout%3Fplan%3Dcustom&cancelUrl=https%3A%2F%2Fcode0.example%2Fde%2Fsubscription%3Fplan%3Dcustom"
    )
})

test("requests a namespace from the main app login for cloud deployments", () => {
    const result = createMainAppLoginUrl(
        "https://app.example/login?source=pricing",
        "https://code0.example/de/checkout?deploymentType=cloud",
        "https://code0.example/de/subscription?deploymentType=cloud",
        true
    )

    assert.equal(new URL(result).searchParams.get("selectNamespace"), "true")
})

test("does not request a namespace for non-cloud deployments", () => {
    const result = createMainAppLoginUrl(
        "https://app.example/login?source=pricing",
        "https://code0.example/de/checkout?deploymentType=self_hosted",
        "https://code0.example/de/subscription?deploymentType=self_hosted"
    )

    assert.equal(new URL(result).searchParams.has("selectNamespace"), false)
})
