import { clearCraterSessionCookie, readCraterSessionAuthorization } from "@/lib/checkout/craterSession"
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
        const returnUrl = resolveLicenseReturnUrl(requestUrl, locale)
        return noStoreRedirect(returnUrl)
    }

    const { getLicenseContent } = await import("@/lib/cms")
    const content = await getLicenseContent(locale)
    const redirectUrl = new URL(content?.redirectUrl ?? `/${locale}`, requestUrl.origin)
    const response = noStoreRedirect(redirectUrl)
    return session.status === "invalid" ? clearCraterSessionCookie(response) : response
}
