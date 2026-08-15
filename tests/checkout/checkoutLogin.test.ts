import assert from "node:assert/strict"
import test from "node:test"
import { createCheckoutQuery, createMainAppLoginUrl, readSagittariusToken, removeSagittariusToken } from "../../src/lib/checkout/checkoutLogin"

test("preserves the subscription configuration for guest checkout", () => {
    const query = createCheckoutQuery({ plan: "custom", tag: ["one", "two"], empty: undefined })

    assert.equal(query, "plan=custom&tag=one&tag=two")
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

test("reads the Sagittarius token returned in the checkout URL", () => {
    const searchParams = new URLSearchParams("plan=custom&token=sagittarius-token")

    assert.equal(readSagittariusToken(searchParams), "sagittarius-token")
})

test("removes only the Sagittarius token from the checkout URL", () => {
    const result = removeSagittariusToken(new URL("https://code0.example/de/checkout?plan=custom&token=secret#billing"))

    assert.equal(result.toString(), "https://code0.example/de/checkout?plan=custom#billing")
})
