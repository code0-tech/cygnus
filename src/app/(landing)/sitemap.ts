export const dynamic = "force-static"

import { getBlogSlugs, getJobSlugs } from "@/lib/cms"
import { SUPPORTED_LOCALES } from "@/lib/i18n"
import { resolveSiteUrl } from "@/lib/siteConfig"

type SitemapEntry = {
    url: string
    lastModified: string
    changeFrequency:
        | "always"
        | "hourly"
        | "daily"
        | "weekly"
        | "monthly"
        | "yearly"
        | "never";
    priority?: number
}

export default async function Sitemap(): Promise<SitemapEntry[]> {
    const siteUrl = resolveSiteUrl()
    const lastModified = new Date().toISOString()
    const staticRoutes = ["", "about-us", "blog", "contact", "features", "jobs", "legal-notice", "privacy", "terms"]

    const staticPages: SitemapEntry[] = SUPPORTED_LOCALES.flatMap((locale, index) =>
        staticRoutes.map((route) => ({
            url: new URL(`/${locale}${route ? `/${route}` : ""}`, siteUrl).toString(),
            lastModified,
            changeFrequency: route === "" ? "weekly" : "monthly",
            priority: route === "" ? (index === 0 ? 1.0 : 0.9) : 0.7,
        }))
    )

    const localizedDynamicEntries = await Promise.all(
        SUPPORTED_LOCALES.map(async (locale) => {
            const [blogSlugs, jobSlugs] = await Promise.all([getBlogSlugs(locale), getJobSlugs(locale)])

            const blogEntries: SitemapEntry[] = blogSlugs.map((slug) => ({
                url: new URL(`/${locale}/blog/${slug}`, siteUrl).toString(),
                lastModified,
                changeFrequency: "monthly",
                priority: 0.6,
            }))

            const jobEntries: SitemapEntry[] = jobSlugs.map((slug) => ({
                url: new URL(`/${locale}/jobs/${slug}`, siteUrl).toString(),
                lastModified,
                changeFrequency: "weekly",
                priority: 0.6,
            }))

            return [...blogEntries, ...jobEntries]
        })
    )

    return [...staticPages, ...localizedDynamicEntries.flat()]
}
