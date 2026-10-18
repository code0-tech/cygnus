import { craterJson, craterTransportErrorResponse, noStoreRedirect as craterNoStoreRedirect } from "@/lib/crater/api.server"
import { isCustomerId, isLicenseId, isSubscriptionId } from "@/lib/crater/request"
import { findCustomerForSubscription, findSubscriptionForLicenseSnapshot } from "@/lib/licenses/snapshotLookup.server"
import { createLicenseActionPath, createLicenseDashboardLoginPath, createLicensePath, isLicenseDashboardAction, resolveSubscriptionRouteId } from "@/lib/licenses/routes"
import { clearCraterSessionCookie, readCraterSessionAuthorization } from "@/lib/crater/session.server"
import { isSupportedLocale, type AppLocale } from "@/lib/i18n"
import { resolveSiteUrl } from "@/lib/siteConfig"
import { ServerError } from "@apollo/client/errors"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

const noStoreRedirect = (url: URL) => craterNoStoreRedirect(url, { noReferrer: true })

function resolveLicenseReturnUrl(requestUrl: URL, locale: string, siteOrigin: string) {
    const fallbackUrl = new URL(`/${locale}/licenses`, siteOrigin)
    const returnPath = requestUrl.searchParams.get("returnPath")
    if (!returnPath?.startsWith("/")) return fallbackUrl

    const returnUrl = new URL(returnPath, siteOrigin)
    const licenseRoot = `/${locale}/licenses`
    if (returnUrl.origin !== siteOrigin || (returnUrl.pathname !== licenseRoot && !returnUrl.pathname.startsWith(`${licenseRoot}/`))) return fallbackUrl

    returnUrl.searchParams.delete("token")
    return returnUrl
}

async function resolveDestination(requestUrl: URL, locale: AppLocale, siteOrigin: string, sessionToken: string) {
    const subscriptionParam = requestUrl.searchParams.get("subscriptionId")?.trim()
    if (subscriptionParam) {
        const subscriptionId = resolveSubscriptionRouteId(subscriptionParam)
        if (!isSubscriptionId(subscriptionId)) return { status: "found" as const, url: new URL(`/${locale}/licenses`, siteOrigin) }

        const lookup = await findCustomerForSubscription(sessionToken, subscriptionId)
        if (lookup.status !== "found") return lookup

        const action = requestUrl.searchParams.get("action")
        const path = createLicenseActionPath(locale, lookup.customerId, subscriptionId, isLicenseDashboardAction(action) ? action : null)
        return { status: "found" as const, url: new URL(path, siteOrigin) }
    }

    if (requestUrl.searchParams.has("licenseId") || requestUrl.searchParams.has("customerId")) {
        const customerId = requestUrl.searchParams.get("customerId") ?? ""
        const licenseId = requestUrl.searchParams.get("licenseId") ?? ""
        if (!isCustomerId(customerId) || !isLicenseId(licenseId)) return { status: "invalid" as const }

        const lookup = await findSubscriptionForLicenseSnapshot(sessionToken, customerId, licenseId)
        if (lookup.status !== "found") return lookup
        return { status: "found" as const, url: new URL(createLicensePath(locale, customerId, lookup.subscriptionId), siteOrigin) }
    }

    return { status: "found" as const, url: resolveLicenseReturnUrl(requestUrl, locale, siteOrigin) }
}

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const siteOrigin = resolveSiteUrl().origin
    const locale = requestUrl.searchParams.get("locale")
    if (!locale || !isSupportedLocale(locale)) {
        return NextResponse.json({ error: "A supported locale is required." }, { status: 400, headers: { "cache-control": "no-store" } })
    }

    const session = readCraterSessionAuthorization(request)
    const isSculptorLink = requestUrl.searchParams.has("subscriptionId")

    const startLogin = (clearSession: boolean) => {
        const accessParams = new URLSearchParams(requestUrl.searchParams)
        accessParams.delete("token")
        const response = noStoreRedirect(new URL(createLicenseDashboardLoginPath(`${requestUrl.pathname}?${accessParams}`), siteOrigin))
        return clearSession ? clearCraterSessionCookie(response) : response
    }

    // This route only uses existing sessions. Tokens in links must never log a browser in;
    // session creation belongs to the callback protected by the state issued at /auth/start.
    const sessionToken = session.status === "authenticated" ? session.token : null
    if (!sessionToken) return startLogin(session.status === "invalid")

    const resolveWith = async (token: string) => {
        try {
            return await resolveDestination(requestUrl, locale, siteOrigin, token)
        } catch (error) {
            if (ServerError.is(error) && error.statusCode === 401) return { status: "unauthenticated" as const }
            throw error
        }
    }

    try {
        const destination = await resolveWith(sessionToken)
        if (destination.status === "found") return noStoreRedirect(destination.url)
        if (destination.status === "invalid") return craterJson({ error: "A valid Crater customer and license snapshot id are required." }, 400)
        if (destination.status === "unauthenticated") {
            if (isSculptorLink) return startLogin(true)
            return clearCraterSessionCookie(craterJson({ error: "The Crater session has no authenticated user." }, 401))
        }
        if (isSculptorLink) return noStoreRedirect(new URL(`/${locale}/licenses`, siteOrigin))
        return craterJson({ error: "The requested license was not found." }, 404)
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error, request)
        if (transportResponse) return transportResponse
        console.error("Crater license access lookup error:", error instanceof Error ? error.name : "Unknown error")
        return craterJson({ error: "Could not open the requested license." }, 502)
    }
}
