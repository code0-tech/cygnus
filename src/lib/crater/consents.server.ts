import { craterJson } from "@/lib/crater/api.server"
import type { JsonObject } from "@/lib/crater/request"
import type { CraterCustomerType } from "@/lib/crater/values"

export type RequiredConsent = "terms" | "withdrawal"

export const MISSING_CONSENT_ERROR_CODE = "MISSING_CONSENT"

/**
 * Every customer accepts the terms; personal customers additionally request the immediate start that waives their
 * right of withdrawal. A customer whose type Crater does not report is treated as personal, so nothing is skipped.
 */
export function requiredConsents(customerType: CraterCustomerType | undefined): RequiredConsent[] {
    return customerType === "business" ? ["terms"] : ["terms", "withdrawal"]
}

/** The consents `body.consents` does not grant. Only a literal `true` counts as given. */
export function missingConsents(body: JsonObject | null, customerType: CraterCustomerType | undefined): RequiredConsent[] {
    const consents = body?.consents && typeof body.consents === "object" && !Array.isArray(body.consents) ? (body.consents as JsonObject) : null
    return requiredConsents(customerType).filter((consent) => consents?.[consent] !== true)
}

/** A 400 response when a required consent is missing, otherwise null. */
export function consentRejection(body: JsonObject | null, customerType: CraterCustomerType | undefined) {
    const missing = missingConsents(body, customerType)
    if (missing.length === 0) return null
    return craterJson({ error: "The required consents were not given.", errorCode: MISSING_CONSENT_ERROR_CODE, missing }, 400)
}
