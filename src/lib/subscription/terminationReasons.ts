// The causes a customer can give for an extraordinary termination (§ 312k BGB). Crater takes the reason as a free
// string and stamps it into the Stripe subscription metadata for the reviewer, so only these fixed codes are sent:
// the reviewer reads the same vocabulary for every request, and no free text from the browser reaches Stripe.
export const EXTRAORDINARY_TERMINATION_REASONS = [
    "ProlongedOutage",
    "UnresolvedMaterialDefect",
    "CoreFeatureRemoved",
    "DataBreachByProvider",
    "BreachOfContractualCommitment",
    "DpaViolation",
    "UnjustifiedSuspension",
    "Other",
] as const

export type ExtraordinaryTerminationReason = (typeof EXTRAORDINARY_TERMINATION_REASONS)[number]

export function isExtraordinaryTerminationReason(value: unknown): value is ExtraordinaryTerminationReason {
    return typeof value === "string" && (EXTRAORDINARY_TERMINATION_REASONS as readonly string[]).includes(value)
}
