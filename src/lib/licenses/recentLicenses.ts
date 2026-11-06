import type { LicenseDashboardLicense } from "@/lib/licenses/types"

export const RECENT_LICENSE_COUNT = 5

export function selectRecentLicenses(licenses: LicenseDashboardLicense[], count = RECENT_LICENSE_COUNT) {
    return licenses.toSorted((left, right) => (Date.parse(right.updatedAt ?? "") || 0) - (Date.parse(left.updatedAt ?? "") || 0)).slice(0, count)
}
