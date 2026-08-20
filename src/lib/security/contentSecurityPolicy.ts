export function createContentSecurityPolicy(nonce: string, development = process.env.NODE_ENV === "development") {
    return [
        "default-src 'self'",
        "base-uri 'self'",
        `connect-src 'self'${development ? " ws: wss:" : ""} https://*.stripe.com https://*.stripe.network https://*.link.com`,
        "font-src 'self' data: https:",
        "form-action 'self'",
        "frame-ancestors 'self'",
        "frame-src 'self' https://*.stripe.com https://*.link.com https://www.youtube.com https://player.vimeo.com",
        "img-src 'self' blob: data: https:",
        "manifest-src 'self'",
        "media-src 'self' blob: https:",
        "object-src 'none'",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""} https://*.stripe.com`,
        "style-src 'self' 'unsafe-inline'",
        "worker-src 'self' blob:",
        ...(development ? [] : ["upgrade-insecure-requests"]),
    ].join("; ")
}
