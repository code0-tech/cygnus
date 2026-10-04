export interface UsagePackagesConfig {
    default?: number | null
    packages?: readonly (number | null | undefined)[] | null
}

export const DEFAULT_USAGE_PACKAGES = {
    aiTokens: {
        b2b: { default: 100_000_000, packages: [10_000_000, 100_000_000, 500_000_000, 1_000_000_000] },
        b2c: { default: 10_000_000, packages: [1_000_000, 10_000_000, 50_000_000, 100_000_000] },
    },
    workflowExecutions: {
        b2b: { default: 1_000_000, packages: [100_000, 1_000_000, 5_000_000, 10_000_000] },
        b2c: { default: 100_000, packages: [10_000, 100_000, 500_000, 1_000_000] },
    },
} as const satisfies Record<"aiTokens" | "workflowExecutions", Record<"b2b" | "b2c", { default: number; packages: readonly number[] }>>

export function withDefaultUsagePackages<T extends UsagePackagesConfig>(config: T | null | undefined, fallback: { default: number; packages: readonly number[] }): T {
    if (config && normalizeUsagePackages(config.packages).length > 0) return config
    return { ...config, default: fallback.default, packages: [...fallback.packages] } as unknown as T
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
