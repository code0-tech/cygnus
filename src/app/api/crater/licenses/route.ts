import { craterJson, craterTransportErrorResponse, requireCraterSession } from "@/lib/checkout/craterApi"
import { setCraterSessionCookie } from "@/lib/checkout/craterSession"
import { loadLicenseDashboardData } from "@/lib/licenses/licenseDashboardService.server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    try {
        const result = await loadLicenseDashboardData(new URL(request.url), session.token)
        if ("error" in result) return craterJson({ error: result.error }, result.status)
        return setCraterSessionCookie(craterJson(result.data), session.token)
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater license dashboard error:", error)
        return craterJson({ error: "Could not load license dashboard data from Crater." }, 502)
    }
}
