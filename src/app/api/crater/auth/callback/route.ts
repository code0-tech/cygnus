import { describeCraterError } from "@/lib/checkout/craterApi"
import { createCraterUserSession } from "@/lib/checkout/craterLogin"
import { setCraterSessionCookie } from "@/lib/checkout/craterSession"
import { isSupportedLocale } from "@/lib/i18n"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

function noStoreRedirect(url: URL) {
    const response = NextResponse.redirect(url)
    response.headers.set("cache-control", "no-store")
    response.headers.set("referrer-policy", "no-referrer")
    return response
}

function resolveCheckoutReturnUrl(requestUrl: URL) {
    const returnPath = requestUrl.searchParams.get("returnPath")
    if (!returnPath?.startsWith("/")) return null

    const returnUrl = new URL(returnPath, requestUrl.origin)
    const segments = returnUrl.pathname.split("/").filter(Boolean)
    if (returnUrl.origin !== requestUrl.origin || segments.length !== 2 || !isSupportedLocale(segments[0]) || segments[1] !== "checkout") return null

    returnUrl.searchParams.delete("token")
    returnUrl.searchParams.delete("authError")
    return returnUrl
}

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const returnUrl = resolveCheckoutReturnUrl(requestUrl)
    if (!returnUrl) {
        const fallbackUrl = new URL("/", requestUrl.origin)
        fallbackUrl.searchParams.set("authError", "session")
        return noStoreRedirect(fallbackUrl)
    }

    const sagittariusToken = requestUrl.searchParams.get("token")?.trim()

    if (!sagittariusToken) {
        returnUrl.searchParams.set("authError", "session")
        return noStoreRedirect(returnUrl)
    }

    try {
        const payload = await createCraterUserSession(sagittariusToken)
        if (payload.errors?.length || !payload.userSession?.token) {
            const failure = describeCraterError(payload.errors)
            console.error("Crater rejected the server-side login callback:", failure ? [failure.errorCode, ...failure.details].join(": ") : "Crater returned no user session token.")
            returnUrl.searchParams.set("authError", "session")
            return noStoreRedirect(returnUrl)
        }

        return setCraterSessionCookie(noStoreRedirect(returnUrl), payload.userSession.token)
    } catch (error) {
        console.error("Crater server-side login callback error:", error instanceof Error ? error.name : "Unknown error")
        returnUrl.searchParams.set("authError", "session")
        return noStoreRedirect(returnUrl)
    }
}
