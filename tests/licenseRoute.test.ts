import { decodeLicenseRouteId } from "@/lib/licenses/licenseRoute"
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
