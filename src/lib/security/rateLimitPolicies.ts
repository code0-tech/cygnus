export type RateLimitPolicyName = "login" | "guest" | "checkout" | "discount"

interface RateLimitPolicyDefinition {
    maxEnvKey: string
    defaultMax: number
    windowEnvKey: string
    defaultWindowSeconds: number
}

export interface RateLimitPolicy {
    max: number
    windowSeconds: number
}

const policyDefinitions = {
    login: {
        maxEnvKey: "CRATER_LOGIN_RATE_LIMIT_MAX",
        defaultMax: 5,
        windowEnvKey: "CRATER_LOGIN_RATE_LIMIT_WINDOW_SECONDS",
        defaultWindowSeconds: 10 * 60,
    },
    // Its own budget rather than the login one: guest creation depends on Sagittarius, and a Sagittarius
    // that refuses every guest must not also lock the browser out of the plain session route the checkout
    // needs afterwards.
    guest: {
        maxEnvKey: "CRATER_GUEST_RATE_LIMIT_MAX",
        defaultMax: 5,
        windowEnvKey: "CRATER_GUEST_RATE_LIMIT_WINDOW_SECONDS",
        defaultWindowSeconds: 10 * 60,
    },
    checkout: {
        maxEnvKey: "CRATER_CHECKOUT_RATE_LIMIT_MAX",
        defaultMax: 20,
        windowEnvKey: "CRATER_CHECKOUT_RATE_LIMIT_WINDOW_SECONDS",
        defaultWindowSeconds: 10 * 60,
    },
    discount: {
        maxEnvKey: "CRATER_DISCOUNT_RATE_LIMIT_MAX",
        defaultMax: 10,
        windowEnvKey: "CRATER_DISCOUNT_RATE_LIMIT_WINDOW_SECONDS",
        defaultWindowSeconds: 10 * 60,
    },
} satisfies Record<RateLimitPolicyName, RateLimitPolicyDefinition>

function positiveInteger(value: string | undefined, fallback: number) {
    if (!value || !/^\d+$/.test(value)) return fallback

    const parsed = Number.parseInt(value, 10)
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function getRateLimitPolicy(name: RateLimitPolicyName, environment: Readonly<Record<string, string | undefined>> = process.env): RateLimitPolicy {
    const definition = policyDefinitions[name]
    return {
        max: positiveInteger(environment[definition.maxEnvKey], definition.defaultMax),
        windowSeconds: positiveInteger(environment[definition.windowEnvKey], definition.defaultWindowSeconds),
    }
}
