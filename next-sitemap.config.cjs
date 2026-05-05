/** @type {import('next-sitemap').IConfig} */
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://code0.tech"

module.exports = {
    siteUrl,
    generateRobotsTxt: true,
    generateIndexSitemap: false,
    exclude: [
        "/admin/*",
        "/api/*",
        "/en/checkout",
        "/de/checkout",
    ],
    alternateRefs: [
        { href: `${siteUrl}/en`, hreflang: "en" },
        { href: `${siteUrl}/de`, hreflang: "de" },
    ],
    robotsTxtOptions: {
        additionalSitemaps: [
            `${siteUrl}/server-sitemap.xml`,
        ],
    },
    additionalPaths: async () => {
        const locales = ["en", "de"]

        const staticPaths = [
            "",
            "about-us",
            "actions",
            "blog",
            "community-edition",
            "contact",
            "enterprise-edition",
            "features",
            "jobs",
            "legal-notice",
            "privacy",
            "subscription",
            "terms",
        ]

        return locales.flatMap((locale) =>
            staticPaths.map((path) => ({
                loc: path ? `/${locale}/${path}` : `/${locale}`,
                changefreq: "weekly",
                priority: path ? 0.7 : 1,
                lastmod: new Date().toISOString()
            }))
        )
    }
}
