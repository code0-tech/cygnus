import "server-only"

import { getClientConfig } from "@/lib/clientConfig.server"

function originOf(value: string) {
    try {
        return value ? new URL(value).origin : null
    } catch {
        return null
    }
}

/**
 * Whether the request is a navigation Sculptor itself opened. Sculptor sets no referrer policy, so the browser's
 * default sends its origin as the `Referer` of cross-origin navigations; a page or mail on any other origin cannot
 * forge it. A missing or foreign referrer, or a navigation the user started directly (typed URL, bookmark, link in an
 * external app), is never trusted.
 */
export function isSculptorNavigation(request: Request) {
    if (request.headers.get("sec-fetch-site") === "none") return false

    const referrerOrigin = originOf(request.headers.get("referer") ?? "")
    if (!referrerOrigin) return false

    const { sculptorLoginUrl, sculptorUrl } = getClientConfig()
    return [sculptorUrl, sculptorLoginUrl].some((url) => originOf(url) === referrerOrigin)
}

/**
 * The Sagittarius login token Sculptor appends to the links it opens. Exchanging a token from any link would allow
 * login CSRF (a victim logged into an attacker's account), so it is only returned for navigations from Sculptor.
 */
export function readSculptorLinkToken(request: Request, requestUrl: URL) {
    const token = requestUrl.searchParams.get("token")?.trim()
    return token && isSculptorNavigation(request) ? token : null
}
