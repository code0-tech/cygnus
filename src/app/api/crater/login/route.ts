import { craterJson, craterMutationErrorResponse } from "@/lib/crater/api.server"
import { optionalString, readJsonObject } from "@/lib/crater/request"
import { createCraterUserSession } from "@/lib/crater/login.server"
import { setCraterSessionCookie } from "@/lib/crater/session.server"
import { enforceRateLimit } from "@/lib/security/rateLimiter"
import { logSecurityEvent } from "@/lib/security/securityLog"

export const runtime = "nodejs"

export async function POST(request: Request) {
    const rateLimitResponse = enforceRateLimit("login", request)
    if (rateLimitResponse) return rateLimitResponse

    const body = await readJsonObject(request)
    const sagittariusToken = optionalString(body?.sagittariusToken)
    const clientMutationId = optionalString(body?.clientMutationId)

    if (!sagittariusToken) {
        return craterJson({ error: "sagittariusToken is required." }, 400)
    }

    try {
        const payload = await createCraterUserSession(sagittariusToken, clientMutationId)

        const errorResponse = craterMutationErrorResponse(payload.errors, "Crater could not create a user session.")
        if (errorResponse) {
            logSecurityEvent({ event: "crater_login_failed", errorCode: payload.errors?.[0]?.errorCode ?? "UNKNOWN" })
            return errorResponse
        }

        if (!payload.userSession?.token) {
            throw new Error("Crater returned no user session token.")
        }

        return setCraterSessionCookie(craterJson({ authenticated: true }), payload.userSession.token)
    } catch (error) {
        console.error("Crater user login error:", error instanceof Error ? error.name : "UnknownError")
        return craterJson({ error: "Could not create Crater session." }, 502)
    }
}
