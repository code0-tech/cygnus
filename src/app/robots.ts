import { MetadataRoute } from "next"
import { resolveSiteUrl } from "@/lib/siteConfig"

export const dynamic = "force-static"

export default function Robots(): MetadataRoute.Robots {
    const siteUrl = resolveSiteUrl()

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/admin", "/api"],
            },
        ],
        host: siteUrl.toString(),
        sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    }
}
