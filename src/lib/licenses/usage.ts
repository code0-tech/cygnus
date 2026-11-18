import type { LicenseUsageMetric } from "@/lib/licenses/types"

// The ES2017 target rules out bigint literals.
const ZERO = BigInt(0)
const PERMILLE = BigInt(1000)

/**
 * How much of the allowance is used, in percent with one decimal, capped at 100. `null` while unlimited. Computed on
 * `bigint` so totals beyond `Number.MAX_SAFE_INTEGER` keep their precision.
 */
export function getUsagePercent(metric: LicenseUsageMetric): number | null {
    if (metric.allowance === null) return null

    const used = BigInt(metric.used)
    const allowance = BigInt(metric.allowance)
    if (allowance === ZERO) return used > ZERO ? 100 : 0

    const permille = (used * PERMILLE) / allowance
    return permille >= PERMILLE ? 100 : Number(permille) / 10
}

export function formatUsageAmount(value: string, locale: string) {
    return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US").format(BigInt(value))
}

export function formatUsagePercent(percent: number, locale: string) {
    return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", { maximumFractionDigits: 1, style: "percent" }).format(percent / 100)
}
