import { withPayload } from "@payloadcms/next/withPayload"
import { NextConfig } from "next"

const isDev = process.env.NODE_ENV === "development"

export function createContentSecurityPolicy(development = isDev) {
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
        `script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ""} https://*.stripe.com`,
        "style-src 'self' 'unsafe-inline'",
        "worker-src 'self' blob:",
        ...(development ? [] : ["upgrade-insecure-requests"]),
    ].join("; ")
}

const nextConfig: NextConfig = {
    output: "standalone",
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: createContentSecurityPolicy(),
                    },
                ],
            },
        ]
    },
    images: {
        dangerouslyAllowLocalIP: isDev,
        remotePatterns: isDev
            ? [
                  {
                      protocol: "http",
                      hostname: "localhost",
                      port: "3000",
                      pathname: "/api/media/**",
                  },
                  {
                      protocol: "http",
                      hostname: "127.0.0.1",
                      port: "3000",
                      pathname: "/api/media/**",
                  },
              ]
            : [],
    },
}

export default withPayload(nextConfig)
