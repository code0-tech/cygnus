import { NextRequest, NextResponse } from "next/server"
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/lib/i18n"
import { createContentSecurityPolicy } from "@/lib/security/contentSecurityPolicy"

function secureResponse(request: NextRequest, response?: NextResponse) {
    const nonce = btoa(crypto.randomUUID())
    const contentSecurityPolicy = createContentSecurityPolicy(nonce)
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-nonce", nonce)
    requestHeaders.set("content-security-policy", contentSecurityPolicy)

    const securedResponse = response ?? NextResponse.next({ request: { headers: requestHeaders } })
    securedResponse.headers.set("Content-Security-Policy", contentSecurityPolicy)
    return securedResponse
}

export function proxy(request: NextRequest) {
    const { pathname: path } = request.nextUrl

    if (path === "/admin" || path.startsWith("/admin/") || SUPPORTED_LOCALES.some((locale) => path === `/${locale}` || path.startsWith(`/${locale}/`))) {
        return secureResponse(request)
    }

    const url = request.nextUrl.clone()
    url.pathname = path === "/" ? `/${DEFAULT_LOCALE}` : `/${DEFAULT_LOCALE}${path}`

    return secureResponse(request, NextResponse.redirect(url))
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
