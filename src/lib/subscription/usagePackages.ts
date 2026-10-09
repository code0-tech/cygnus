export type UsagePackageKind = "aiTokens" | "workflowExecutions"
export type UsagePackageValues<T> = Record<UsagePackageKind, T>

export interface CheckoutPackages {
    quantitySteps: Record<"b2b" | "b2c", UsagePackageValues<number[]>>
    planQuantities: Record<"pro" | "max", UsagePackageValues<number>>
}

export interface UsagePackagesConfig {
    default?: number | null
    packages?: readonly (number | null | undefined)[] | null
}

export function normalizeUsagePackages(packages: UsagePackagesConfig["packages"]): number[] {
    const valid = (packages ?? []).filter((value): value is number => typeof value === "number" && Number.isSafeInteger(value) && value > 0)
    return Array.from(new Set(valid)).sort((first, second) => first - second)
}

export function isUsagePackage(value: number, packages: readonly number[]) {
    return packages.includes(value)
}

export function snapToUsagePackage(value: number, packages: readonly number[]) {
    if (packages.length === 0) return value
    if (!Number.isFinite(value)) return packages[0]
    return packages.find((candidate) => candidate >= value) ?? packages[packages.length - 1]
}

export function getDefaultUsagePackage(config: UsagePackagesConfig) {
    const packages = normalizeUsagePackages(config.packages)
    if (typeof config.default === "number" && isUsagePackage(config.default, packages)) return config.default
    return packages[0] ?? 0
}
