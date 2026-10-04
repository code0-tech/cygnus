import { craterJson, craterTransportErrorResponse } from "@/lib/crater/api.server"
import { isLicenseId } from "@/lib/crater/request"
import { findSubscriptionForLicenseSnapshot } from "@/lib/licenses/licenseSnapshotLookup.server"
import { createLicensePath } from "@/lib/licenses/licenseRoute"
import { clearCraterSessionCookie, readCraterSessionAuthorization } from "@/lib/crater/session.server"
import { isSupportedLocale } from "@/lib/i18n"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

function noStoreRedirect(url: URL) {
    const response = NextResponse.redirect(url)
    response.headers.set("cache-control", "no-store")
    return response
}

function resolveLicenseReturnUrl(requestUrl: URL, locale: string) {
    const fallbackUrl = new URL(`/${locale}/licenses`, requestUrl.origin)
    const returnPath = requestUrl.searchParams.get("returnPath")
    if (!returnPath?.startsWith("/")) return fallbackUrl

    const returnUrl = new URL(returnPath, requestUrl.origin)
    const licenseRoot = `/${locale}/licenses`
    if (returnUrl.origin !== requestUrl.origin || (returnUrl.pathname !== licenseRoot && !returnUrl.pathname.startsWith(`${licenseRoot}/`))) return fallbackUrl

    returnUrl.searchParams.delete("token")
    return returnUrl
}

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const locale = requestUrl.searchParams.get("locale")
    if (!locale || !isSupportedLocale(locale)) {
        return NextResponse.json({ error: "A supported locale is required." }, { status: 400, headers: { "cache-control": "no-store" } })
    }

    const session = readCraterSessionAuthorization(request)

    if (session.status === "authenticated") {
        if (requestUrl.searchParams.has("licenseId") || requestUrl.searchParams.has("customerId")) {
            const customerId = requestUrl.searchParams.get("customerId") ?? ""
            const licenseId = requestUrl.searchParams.get("licenseId") ?? ""
            if (!/^gid:\/\/crater\/Customer\/\d+$/.test(customerId) || !isLicenseId(licenseId)) return craterJson({ error: "A valid Crater customer and license snapshot id are required." }, 400)
            try {
                const lookup = await findSubscriptionForLicenseSnapshot(session.token, customerId, licenseId)
                if (lookup.status === "unauthenticated") return clearCraterSessionCookie(craterJson({ error: "The Crater session has no authenticated user." }, 401))
                if (lookup.status === "missing") return craterJson({ error: "The requested license was not found." }, 404)
                return noStoreRedirect(new URL(createLicensePath(locale, customerId, lookup.subscriptionId), requestUrl.origin))
            } catch (error) {
                const transportResponse = craterTransportErrorResponse(error, request)
                if (transportResponse) return transportResponse
                console.error("Crater license snapshot lookup error:", error instanceof Error ? error.name : "Unknown error")
                return craterJson({ error: "Could not open the requested license." }, 502)
            }
        }
        const returnUrl = resolveLicenseReturnUrl(requestUrl, locale)
        return noStoreRedirect(returnUrl)
    }

    const { getLicenseContent } = await import("@/lib/cms")
    const content = await getLicenseContent(locale)
    const redirectUrl = new URL(content?.redirectUrl ?? `/${locale}`, requestUrl.origin)
    const response = noStoreRedirect(redirectUrl)
    return session.status === "invalid" ? clearCraterSessionCookie(response) : response
}
