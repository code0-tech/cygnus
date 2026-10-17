import { craterJson, craterMutationErrorResponse } from "@/lib/crater/api.server"
import { isValidEmail, optionalString, readJsonObject } from "@/lib/crater/request"
import { describeCraterError } from "@/lib/crater/errors"
import { createCraterGuestUser } from "@/lib/crater/login.server"
import { createGuestCheckoutSession, pruneGuestCheckoutSessions } from "@/lib/checkout/guestCheckoutSession"
import { randomBytes } from "node:crypto"
import { enforceRateLimit } from "@/lib/security/rateLimiter"
import { logSecurityEvent } from "@/lib/security/securityLog"

export const runtime = "nodejs"

export async function POST(request: Request) {
    const body = await readJsonObject(request)
    const email = optionalString(body?.email)
    const clientMutationId = optionalString(body?.clientMutationId)

    const rateLimitResponse = enforceRateLimit("guest", request, email)
    if (rateLimitResponse) return rateLimitResponse

    if (!email || !isValidEmail(email)) {
        return craterJson({ error: "A valid email is required to continue as a guest." }, 400)
    }

    try {
        const payload = await createCraterGuestUser(email, clientMutationId)

        const errorResponse = craterMutationErrorResponse(payload.errors, "Crater could not create a guest user.")
        if (errorResponse) {
            const failure = describeCraterError(payload.errors)
            logSecurityEvent({ event: "crater_guest_user_failed", errorCode: failure?.errorCode ?? "UNKNOWN" })
            // GUEST_USER_CREATION_FAILED only says that Sagittarius refused. Whatever Crater passes along in
            // details is the single hint at why, so it goes to the log instead of on the floor.
            console.error("Crater rejected the guest user creation:", failure ? [failure.errorCode, ...failure.details].join(": ") : "Crater returned no error detail.")
            return errorResponse
        }

        if (!payload.userSession?.token) {
            throw new Error("Crater returned no guest user session token.")
        }

        const checkoutId = randomBytes(16).toString("hex")
        const response = pruneGuestCheckoutSessions(craterJson({ authenticated: true, checkoutId }), request)
        return createGuestCheckoutSession(response, checkoutId, payload.userSession.token, payload.claimToken, email)
    } catch (error) {
        console.error("Crater guest user error:", error instanceof Error ? error.name : "UnknownError")
        return craterJson({ error: "Could not create a Crater guest user." }, 502)
    }
}
