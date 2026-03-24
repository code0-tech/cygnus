import { NextRequest, NextResponse } from "next/server"
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/lib/i18n"

export function proxy(request: NextRequest) {
    const { pathname: path } = request.nextUrl

    if (SUPPORTED_LOCALES.some((locale) => path === `/${locale}` || path.startsWith(`/${locale}/`))) {
        return NextResponse.next()
    }

    const url = request.nextUrl.clone()
    url.pathname = path === "/" ? `/${DEFAULT_LOCALE}` : `/${DEFAULT_LOCALE}${path}`

    return NextResponse.redirect(url)
}

export const config = {
    matcher: ["/((?!api|admin|_next|.*\\..*).*)"],
}
