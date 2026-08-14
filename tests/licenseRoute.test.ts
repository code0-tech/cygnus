import { decodeLicenseRouteId, getNamespaceDisplayId } from "@/lib/licenses/licenseRoute"
import assert from "node:assert/strict"
import test from "node:test"

test("normalizes encoded and already decoded Crater route ids", () => {
    const customerId = "gid://crater/Customer/35"

    assert.equal(decodeLicenseRouteId(encodeURIComponent(customerId)), customerId)
    assert.equal(decodeLicenseRouteId(customerId), customerId)
})

test("leaves malformed route encoding unchanged", () => {
    assert.equal(decodeLicenseRouteId("gid%invalid"), "gid%invalid")
})

test("shows only the final namespace ID segment", () => {
    assert.equal(getNamespaceDisplayId("gid://sagittarius/Namespace/123"), "123")
    assert.equal(getNamespaceDisplayId("namespace-9"), "namespace-9")
    assert.equal(getNamespaceDisplayId(), undefined)
})
