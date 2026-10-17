import { canonicalizeLicensePathname, createLicenseCustomerPath, createLicensePath, getNamespaceDisplayId, resolveCustomerRouteId, resolveSubscriptionRouteId } from "@/lib/licenses/routes"
import assert from "node:assert/strict"
import test from "node:test"

test("resolves short and legacy Crater route ids", () => {
    const customerId = "gid://crater/Customer/35"
    const licenseId = "gid://crater/Subscription/9"

    assert.equal(resolveCustomerRouteId("35"), customerId)
    assert.equal(resolveCustomerRouteId(encodeURIComponent(customerId)), customerId)
    assert.equal(resolveCustomerRouteId(customerId), customerId)
    assert.equal(resolveSubscriptionRouteId("9"), licenseId)
})

test("leaves malformed route encoding unchanged", () => {
    assert.equal(resolveSubscriptionRouteId("gid%invalid"), "gid%invalid")
})

test("builds license URLs with only numeric ids", () => {
    assert.equal(createLicenseCustomerPath("de", "gid://crater/Customer/35"), "/de/licenses/customer/35")
    assert.equal(createLicensePath("en", "gid://crater/Customer/35", "gid://crater/Subscription/9"), "/en/licenses/customer/35/license/9")
    assert.equal(createLicensePath("en", encodeURIComponent("gid://crater/Customer/35"), encodeURIComponent("gid://crater/Subscription/9")), "/en/licenses/customer/35/license/9")
})

test("canonicalizes legacy license URLs while preserving their destination", () => {
    assert.equal(canonicalizeLicensePathname("/en/licenses/customer/gid%3A%2F%2Fcrater%2FCustomer%2F35/license/gid%3A%2F%2Fcrater%2FSubscription%2F9/edit"), "/en/licenses/customer/35/license/9/edit")
    assert.equal(canonicalizeLicensePathname("/de/licenses/customer/35/license/9"), "/de/licenses/customer/35/license/9")
})

test("shows only the final namespace ID segment", () => {
    assert.equal(getNamespaceDisplayId("gid://sagittarius/Namespace/123"), "123")
    assert.equal(getNamespaceDisplayId("namespace-9"), "namespace-9")
    assert.equal(getNamespaceDisplayId(), undefined)
})
