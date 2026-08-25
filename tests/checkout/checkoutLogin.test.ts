import assert from "node:assert/strict"
import test from "node:test"
import { createCheckoutQuery, createCraterLoginCallbackUrl, createMainAppLoginUrl } from "../../src/lib/checkout/checkoutLogin"
import {
    createLicenseNamespaceCallbackUrl,
    createLicenseNamespaceReturnPath,
} from "../../src/lib/licenses/licenseNamespaceSelection"

test("preserves the subscription configuration for guest checkout", () => {
    const query = createCheckoutQuery({ plan: "custom", tag: ["one", "two"], token: "secret", authError: "session", empty: undefined })

    assert.equal(query, "plan=custom&tag=one&tag=two")
})

test("routes the Sagittarius login response through the server-side Crater callback", () => {
    const result = createCraterLoginCallbackUrl(new URL("https://code0.example"), "/de/checkout?plan=custom")

    assert.equal(result, "https://code0.example/api/crater/auth/callback?returnPath=%2Fde%2Fcheckout%3Fplan%3Dcustom")
})

test("routes namespace selection back to one exact license", () => {
    const returnPath = createLicenseNamespaceReturnPath("de", "gid://crater/Customer/3", "gid://crater/License/9")
    const callbackUrl = createLicenseNamespaceCallbackUrl(new URL("https://code0.example"), returnPath)

    assert.equal(returnPath, "/de/licenses/customer/gid%3A%2F%2Fcrater%2FCustomer%2F3/license/gid%3A%2F%2Fcrater%2FLicense%2F9/edit")
    assert.equal(
        callbackUrl,
        "https://code0.example/api/crater/licenses/namespace/callback?returnPath=%2Fde%2Flicenses%2Fcustomer%2Fgid%253A%252F%252Fcrater%252FCustomer%252F3%2Flicense%2Fgid%253A%252F%252Fcrater%252FLicense%252F9%2Fedit"
    )
})

test("does not encode license route parameters a second time", () => {
    const customerId = encodeURIComponent("gid://crater/Customer/3")
    const licenseId = encodeURIComponent("gid://crater/License/9")

    assert.equal(
        createLicenseNamespaceReturnPath("en", customerId, licenseId),
        "/en/licenses/customer/gid%3A%2F%2Fcrater%2FCustomer%2F3/license/gid%3A%2F%2Fcrater%2FLicense%2F9/edit"
    )
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
