import { craterJson, withCraterSession } from "@/lib/crater/api.server"
import { setCraterSessionCookie } from "@/lib/crater/session.server"
import { loadLicenseDashboardData } from "@/lib/licenses/dashboard.server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const GET = withCraterSession({ log: "Crater license dashboard error", error: "Could not load license dashboard data from Crater." }, async (request, token) => {
    const result = await loadLicenseDashboardData(new URL(request.url), token)
    if ("error" in result) return craterJson({ error: result.error }, result.status)
    return setCraterSessionCookie(craterJson(result.data), token)
})
