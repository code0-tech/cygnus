export function getMediaUrl(url?: string | null) {
    if (!url) return ""
    if (url.startsWith("/")) return url

    try {
        const parsedUrl = new URL(url)
        const appUrl = typeof window === "undefined" ? process.env.SERVER_URL : window.location.origin
        const appOrigin = appUrl ? new URL(appUrl).origin : null
        const isLocalPayloadUrl = ["localhost", "127.0.0.1", "0.0.0.0"].includes(parsedUrl.hostname)
        const isAppPayloadUrl = appOrigin ? parsedUrl.origin === appOrigin : false

        if ((isLocalPayloadUrl || isAppPayloadUrl) && parsedUrl.pathname.startsWith("/api/media/file/")) {
            return `${parsedUrl.pathname}${parsedUrl.search}`
        }
    } catch {
        return url
    }

    return url
}
