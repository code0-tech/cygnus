import { canonicalizeLicensePathname, createLicenseCustomerPath, createLicenseDashboardEntryPath, createLicensePath, resolveCustomerRouteId, resolveSubscriptionRouteId } from "@/lib/licenses/routes"
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

test("routes Sculptor dashboard links through the access route and drops unrelated parameters", () => {
    const entry = createLicenseDashboardEntryPath(new URL("https://code0.example/en/licenses?ref=license_card_edit&token=abc&namespace=1&licenseId=5&subscriptionId=5&action=upgrade"))
    assert.equal(entry, "/api/crater/licenses/access?locale=en&token=abc&subscriptionId=5&action=upgrade")
    assert.equal(createLicenseDashboardEntryPath(new URL("https://code0.example/en/licenses?view=all")), null)
    assert.equal(createLicenseDashboardEntryPath(new URL("https://code0.example/en/licenses/customer/3?token=abc")), null)
    assert.equal(createLicenseDashboardEntryPath(new URL("https://code0.example/xx/licenses?token=abc")), null)
})
