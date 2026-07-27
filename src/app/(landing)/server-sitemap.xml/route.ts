import { getActionSlugs, getBlogSlugs, getCustomLandingPageSlugs, getJobSlugs } from "@/lib/cms"
import { SUPPORTED_LOCALES } from "@/lib/i18n"
import { resolveSiteUrl } from "@/lib/siteConfig"

export const dynamic = "force-dynamic"

type SitemapUrl = {
    loc: string
    lastmod: string
    changefreq: "daily" | "weekly" | "monthly"
    priority: number
}

function escapeXml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;")
}

function renderSitemap(urls: SitemapUrl[]) {
    const entries = urls.map((url) => [
        "  <url>",
        `    <loc>${escapeXml(url.loc)}</loc>`,
        `    <lastmod>${url.lastmod}</lastmod>`,
        `    <changefreq>${url.changefreq}</changefreq>`,
        `    <priority>${url.priority.toFixed(1)}</priority>`,
        "  </url>",
    ].join("\n")).join("\n")

    return [
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
        "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
        entries,
        "</urlset>",
    ].join("\n")
}

export async function GET() {
    const siteUrl = resolveSiteUrl()
    const lastmod = new Date().toISOString()

    const localizedUrls = await Promise.all(
        SUPPORTED_LOCALES.map(async (locale) => {
            const [blogSlugs, jobSlugs, actionSlugs, customPageSlugs] = await Promise.all([
                getBlogSlugs(locale),
                getJobSlugs(locale),
                getActionSlugs(locale),
                getCustomLandingPageSlugs(locale),
            ])

            const customPageUrls = customPageSlugs.map((slug): SitemapUrl => ({
                loc: new URL(`/${locale}/${slug}`, siteUrl).toString(),
                lastmod,
                changefreq: "weekly",
                priority: 0.7,
            }))

            const blogUrls = blogSlugs.map((slug): SitemapUrl => ({
                loc: new URL(`/${locale}/blog/${slug}`, siteUrl).toString(),
                lastmod,
                changefreq: "monthly",
                priority: 0.6
            }))

            const jobUrls = jobSlugs.map((slug): SitemapUrl => ({
                loc: new URL(`/${locale}/jobs/${slug}`, siteUrl).toString(),
                lastmod,
                changefreq: "monthly",
                priority: 0.6
            }))

            const actionUrls = actionSlugs.map((slug): SitemapUrl => ({
                loc: new URL(`/${locale}/actions/${slug}`, siteUrl).toString(),
                lastmod,
                changefreq: "monthly",
                priority: 0.6
            }))

            return [...customPageUrls, ...blogUrls, ...jobUrls, ...actionUrls]
        })
    )

    return new Response(renderSitemap(localizedUrls.flat()), {
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        }
    })
}
