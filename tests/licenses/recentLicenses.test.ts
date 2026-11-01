import assert from "node:assert/strict"
import test from "node:test"
import { selectRecentLicenses } from "../../src/lib/licenses/recentLicenses"
import type { LicenseDashboardLicense } from "../../src/lib/licenses/types"

function license(id: string, updatedAt?: string) {
    return { id, updatedAt } as LicenseDashboardLicense
}

test("recent licenses are the most recently edited ones, newest first", () => {
    const licenses = Array.from({ length: 7 }, (_, index) => license(`l${index}`, `2026-10-0${index + 1}T00:00:00Z`))

    assert.deepEqual(
        selectRecentLicenses(licenses).map(({ id }) => id),
        ["l6", "l5", "l4", "l3", "l2"]
    )
})

test("licenses without a valid edit date are listed after dated ones", () => {
    const licenses = [license("undated"), license("invalid", "not-a-date"), license("dated", "2026-10-01T00:00:00Z")]

    assert.deepEqual(selectRecentLicenses(licenses, 2).map(({ id }) => id), ["dated", "undated"])
})
