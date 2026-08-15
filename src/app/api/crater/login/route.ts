import { craterJson, craterMutationErrorResponse, optionalString, readJsonObject } from "@/lib/checkout/craterApi"
import { createCraterUserSession } from "@/lib/checkout/craterLogin"
import { setCraterSessionCookie } from "@/lib/checkout/craterSession"

export const runtime = "nodejs"

export async function POST(request: Request) {
    const body = await readJsonObject(request)
    const sagittariusToken = optionalString(body?.sagittariusToken) ?? optionalString(process.env.CRATER_SAGITTARIUS_TOKEN)
    const clientMutationId = optionalString(body?.clientMutationId)

    if (!sagittariusToken) {
        return craterJson({ error: "sagittariusToken is required." }, 400)
    }

    try {
        const payload = await createCraterUserSession(sagittariusToken, clientMutationId)

        const errorResponse = craterMutationErrorResponse(payload.errors, "Crater could not create a user session.")
        if (errorResponse) return errorResponse

        if (!payload.userSession?.token) {
            throw new Error("Crater returned no user session token.")
        }

        return setCraterSessionCookie(craterJson({ authenticated: true }), payload.userSession.token)
    } catch (error) {
        console.error("Crater user login error:", error)
        return craterJson({ error: "Could not create Crater session." }, 502)
    }
}
