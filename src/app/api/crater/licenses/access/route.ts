import { craterJson, craterTransportErrorResponse, noStoreRedirect as craterNoStoreRedirect } from "@/lib/crater/api.server"
import { describeCraterError } from "@/lib/crater/errors"
import { createCraterUserSession } from "@/lib/crater/login.server"
import { isCustomerId, isLicenseId, isSubscriptionId } from "@/lib/crater/request"
import { findCustomerForSubscription, findSubscriptionForLicenseSnapshot } from "@/lib/licenses/snapshotLookup.server"
import { createLicenseActionPath, createLicenseDashboardLoginPath, createLicensePath, isLicenseDashboardAction, resolveSubscriptionRouteId } from "@/lib/licenses/routes"
import { clearCraterSessionCookie, readCraterSessionAuthorization, setCraterSessionCookie, setCraterUserLoginCookie } from "@/lib/crater/session.server"
import { isSupportedLocale, type AppLocale } from "@/lib/i18n"
import { enforceRateLimit } from "@/lib/security/rateLimiter"
import { logSecurityEvent } from "@/lib/security/securityLog"
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

async function exchangeSagittariusToken(request: Request, sagittariusToken: string) {
    if (enforceRateLimit("login", request)) return null

    try {
        const payload = await createCraterUserSession(sagittariusToken)
        if (payload.errors?.length || !payload.userSession?.token) {
            const failure = describeCraterError(payload.errors)
            logSecurityEvent({ event: "crater_login_failed", errorCode: failure?.errorCode ?? "UNKNOWN" })
            return null
        }
        return payload.userSession.token
    } catch (error) {
        console.error("Crater license link login error:", error instanceof Error ? error.name : "Unknown error")
        return null
    }
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
    const sagittariusToken = requestUrl.searchParams.get("token")?.trim()
    const isSculptorLink = requestUrl.searchParams.has("subscriptionId")

    const startLogin = (clearSession: boolean) => {
        const accessParams = new URLSearchParams(requestUrl.searchParams)
        accessParams.delete("token")
        const response = noStoreRedirect(new URL(createLicenseDashboardLoginPath(`${requestUrl.pathname}?${accessParams}`), siteOrigin))
        return clearSession ? clearCraterSessionCookie(response) : response
    }

    let sessionToken = session.status === "authenticated" ? session.token : null
    let exchangedToken: string | null = null
    if (!sessionToken && sagittariusToken) {
        exchangedToken = await exchangeSagittariusToken(request, sagittariusToken)
        sessionToken = exchangedToken
    }
    if (!sessionToken) return startLogin(session.status === "invalid")

    const withExchangedSession = (response: NextResponse) => (exchangedToken ? setCraterUserLoginCookie(setCraterSessionCookie(response, exchangedToken)) : response)

    const resolveWith = async (token: string) => {
        try {
            return await resolveDestination(requestUrl, locale, siteOrigin, token)
        } catch (error) {
            if (ServerError.is(error) && error.statusCode === 401) return { status: "unauthenticated" as const }
            throw error
        }
    }

    try {
        let destination = await resolveWith(sessionToken)
        if (destination.status !== "found" && destination.status !== "invalid" && !exchangedToken && sagittariusToken) {
            exchangedToken = await exchangeSagittariusToken(request, sagittariusToken)
            if (exchangedToken) destination = await resolveWith(exchangedToken)
        }

        if (destination.status === "found") return withExchangedSession(noStoreRedirect(destination.url))
        if (destination.status === "invalid") return craterJson({ error: "A valid Crater customer and license snapshot id are required." }, 400)
        if (destination.status === "unauthenticated") {
            if (exchangedToken || isSculptorLink) return startLogin(!exchangedToken)
            return clearCraterSessionCookie(craterJson({ error: "The Crater session has no authenticated user." }, 401))
        }
        if (isSculptorLink) return withExchangedSession(noStoreRedirect(new URL(`/${locale}/licenses`, siteOrigin)))
        return craterJson({ error: "The requested license was not found." }, 404)
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error, request)
        if (transportResponse) return transportResponse
        console.error("Crater license access lookup error:", error instanceof Error ? error.name : "Unknown error")
        return craterJson({ error: "Could not open the requested license." }, 502)
    }
}
