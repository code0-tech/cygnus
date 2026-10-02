import { craterJson, optionalString, readJsonObject, requireCraterSession } from "@/lib/checkout/craterApi"
import { enforceRateLimit } from "@/lib/security/rateLimiter"

export const runtime = "nodejs"

// Kept for older clients. Crater no longer validates discounts; the active Stripe checkout does.
export async function POST(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response
    const rateLimitResponse = enforceRateLimit("discount", request)
    if (rateLimitResponse) return rateLimitResponse
    const body = await readJsonObject(request)
    if (!optionalString(body?.code)) return craterJson({ error: "code is required." }, 400)
    return craterJson({ error: "Apply promotion codes through the active checkout session." }, 410)
}
