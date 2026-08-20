import { withPayload } from "@payloadcms/next/withPayload"
import { NextConfig } from "next"

const isDev = process.env.NODE_ENV === "development"

const nextConfig: NextConfig = {
    output: "standalone",
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
