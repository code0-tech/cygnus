import { craterJson, craterTransportErrorResponse, noStoreRedirect as craterNoStoreRedirect } from "@/lib/crater/api.server"
import { describeCraterError } from "@/lib/crater/errors"
import { createCraterUserSession } from "@/lib/crater/login.server"
import { revokeCraterSession } from "@/lib/crater/logout.server"
import { isCustomerId, isLicenseId, isSubscriptionId } from "@/lib/crater/request"
import { findCustomerForSubscription, findSubscriptionForLicenseSnapshot } from "@/lib/licenses/snapshotLookup.server"
import { createLicenseActionPath, createLicenseDashboardLoginPath, createLicensePath, isLicenseDashboardAction, resolveSubscriptionRouteId } from "@/lib/licenses/routes"
import { clearCraterSessionCookie, readCraterSessionAuthorization, setCraterSessionCookie, setCraterUserLoginCookie } from "@/lib/crater/session.server"
import { isSculptorNavigation, readSculptorLinkToken } from "@/lib/crater/sculptorLink.server"
import { isSupportedLocale, type AppLocale } from "@/lib/i18n"
import { enforceRateLimit } from "@/lib/security/rateLimiter"
import { logSecurityEvent } from "@/lib/security/securityLog"
import { resolveSiteUrl } from "@/lib/siteConfig"
import { ServerError } from "@apollo/client/errors"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

const noStoreRedirect = (url: URL) => craterNoStoreRedirect(url, { noReferrer: true })

const SESSION_SWITCH_PARAM = "sessionSwitch"

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

async function exchangeSculptorLinkToken(request: Request, sagittariusToken: string) {
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
        console.error("Crater Sculptor link login error:", error instanceof Error ? error.name : "Unknown error")
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
    const isSculptorLink = requestUrl.searchParams.has("subscriptionId")

    const startLogin = (clearSession: boolean, switchSession = false) => {
        const accessParams = new URLSearchParams(requestUrl.searchParams)
        accessParams.delete("token")
        if (switchSession) accessParams.set(SESSION_SWITCH_PARAM, "1")
        const response = noStoreRedirect(new URL(createLicenseDashboardLoginPath(`${requestUrl.pathname}?${accessParams}`), siteOrigin))
        return clearSession ? clearCraterSessionCookie(response) : response
    }

    // Sculptor opens this route with a fresh Sagittarius login token, so a user coming from Sculptor is signed in
    // without its consent screen. The token is only honoured for navigations Sculptor opened; any other link falls
    // back to the login protected by the state issued at /auth/start, so a forged link cannot log a browser in.
    const linkToken = readSculptorLinkToken(request, requestUrl)
    const existingSessionToken = session.status === "authenticated" ? session.token : null
    let exchangedToken: string | null = null
    const exchangeLinkToken = async () => {
        exchangedToken = linkToken ? await exchangeSculptorLinkToken(request, linkToken) : null
        return exchangedToken
    }

    let sessionToken = existingSessionToken ?? (await exchangeLinkToken())
    if (!sessionToken) return startLogin(session.status === "invalid")

    // Replaces the browser's session with the one from the link and revokes the session it replaces.
    const withExchangedSession = async (response: NextResponse) => {
        if (!exchangedToken) return response
        if (existingSessionToken) await revokeCraterSession(existingSessionToken)
        return setCraterUserLoginCookie(setCraterSessionCookie(response, exchangedToken))
    }

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
        // The link names the Sculptor user's subscription. When the existing session cannot open it (another user or an
        // expired session), the link's own user takes over.
        if (destination.status !== "found" && destination.status !== "invalid" && existingSessionToken && linkToken && (await exchangeLinkToken())) {
            sessionToken = exchangedToken!
            destination = await resolveWith(sessionToken)
        }

        if (destination.status === "found") return await withExchangedSession(noStoreRedirect(destination.url))
        if (destination.status === "invalid") return craterJson({ error: "A valid Crater customer and license snapshot id are required." }, 400)
        if (destination.status === "unauthenticated") {
            if (isSculptorLink) return startLogin(true)
            return clearCraterSessionCookie(craterJson({ error: "The Crater session has no authenticated user." }, 401))
        }
        if (isSculptorLink) {
            if (exchangedToken) return await withExchangedSession(noStoreRedirect(new URL(`/${locale}/licenses`, siteOrigin)))
            // Only Sculptor may end the session to switch users: any page can link here, and revoking for every
            // foreign link would let it log the browser out.
            if (requestUrl.searchParams.get(SESSION_SWITCH_PARAM) !== "1" && isSculptorNavigation(request)) {
                await revokeCraterSession(sessionToken)
                return startLogin(true, true)
            }
            return noStoreRedirect(new URL(`/${locale}/licenses`, siteOrigin))
        }
        return craterJson({ error: "The requested license was not found." }, 404)
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error, request)
        if (transportResponse) return transportResponse
        console.error("Crater license access lookup error:", error instanceof Error ? error.name : "Unknown error")
        return craterJson({ error: "Could not open the requested license." }, 502)
    }
}
