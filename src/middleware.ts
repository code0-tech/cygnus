import { NextRequest, NextResponse } from "next/server"


import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/lib/i18n"

function hasLocalePrefix(pathname: string): boolean {
    return SUPPORTED_LOCALES.some(
        (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
    )
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    if (hasLocalePrefix(pathname)) {
        return NextResponse.next()
    }

    const url = request.nextUrl.clone()
    url.pathname = pathname === "/" ? `/${DEFAULT_LOCALE}` : `/${DEFAULT_LOCALE}${pathname}`

    return NextResponse.redirect(url)
}

export const config = {
    matcher: ["/((?!api|admin|_next|.*\\..*).*)"],
}
