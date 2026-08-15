import assert from "node:assert/strict"
import test from "node:test"
import { getCheckoutStatusPollDelay, hasCheckoutStatusPollingExpired } from "../../src/lib/checkout/checkoutStatusPolling"

test("backs checkout completion polling off from two to ten seconds", () => {
    assert.deepEqual([0, 1, 2, 3, 4, 20].map(getCheckoutStatusPollDelay), [2_000, 4_000, 8_000, 10_000, 10_000, 10_000])
})

test("stops automatic checkout completion polling after five minutes", () => {
    const startedAt = 1_000_000

    assert.equal(hasCheckoutStatusPollingExpired(startedAt, startedAt + 5 * 60_000 - 1), false)
    assert.equal(hasCheckoutStatusPollingExpired(startedAt, startedAt + 5 * 60_000), true)
})
