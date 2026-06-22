export function getMediaUrl(url?: string | null) {
    if (!url) return ""
    if (url.startsWith("/")) return url

    try {
        const parsedUrl = new URL(url)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL
        const appOrigin = appUrl ? new URL(appUrl).origin : null
        const isLocalPayloadUrl = parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1"
        const isAppPayloadUrl = appOrigin ? parsedUrl.origin === appOrigin : false

        if ((isLocalPayloadUrl || isAppPayloadUrl) && parsedUrl.pathname.startsWith("/api/media/file/")) {
            return `${parsedUrl.pathname}${parsedUrl.search}`
        }
    } catch {
        return url
    }

    return url
}
