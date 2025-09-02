import { MetadataRoute } from "next"

export default function Robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: ["/"],
            disallow: "/admin"
        },
        host:  "www.code0.tech",
        sitemap: "https:/www.code0.tech/sitemap.xml"
    }
}