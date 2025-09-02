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
    const baseUrl = "https://www.code0.tech"

    const staticPages: SitemapEntry[] = [
        {
            url: baseUrl,
            lastModified: new Date().toISOString(),
            changeFrequency: "monthly",
            priority: 1.0
        },
    ]

    return [...staticPages]
}