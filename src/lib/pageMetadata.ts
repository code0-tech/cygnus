import { type Media, type Page } from "@/payload-types"
import { getCustomLandingPage, getLandingPage } from "@/lib/cms"
import { isSupportedLocale, type AppLocale } from "@/lib/i18n"
import { createMetadata, resolveSiteUrl } from "@/lib/siteConfig"
import type { Metadata } from "next"

function getMediaUrl(value?: number | Media | null) {
    if (!value || typeof value === "number" || !value.url) {
        return undefined
    }

    return new URL(value.url, resolveSiteUrl()).toString()
}

function getPagePath(locale: AppLocale, slug: string) {
    return slug === "main" ? `/${locale}` : `/${locale}/${slug}`
}

export async function getLandingPageMetadata(slug: string, locale: string): Promise<Metadata> {
    if (!isSupportedLocale(locale)) {
        return createMetadata()
    }

    const page = await getLandingPage(slug, locale)
    if (!page) {
        return createMetadata()
    }

    return mapLandingPageToMetadata(page, locale)
}

export async function getCustomLandingPageMetadata(slug: string, locale: string): Promise<Metadata> {
    if (!isSupportedLocale(locale)) {
        return createMetadata()
    }

    const page = await getCustomLandingPage(slug, locale)
    if (!page) {
        return createMetadata()
    }

    return mapLandingPageToMetadata(page, locale)
}

function mapLandingPageToMetadata(page: Page, locale: AppLocale): Metadata {
    const title = page.meta?.title ?? page.title
    const description = page.meta?.description ?? undefined
    const slug = page.customPage ? page.customSlug : page.slug
    const canonicalPath = getPagePath(locale, slug ?? "")
    const canonicalUrl = new URL(canonicalPath, resolveSiteUrl()).toString()
    const image = getMediaUrl(page.meta?.image)

    return createMetadata({
        title,
        description,
        alternates: {
            canonical: canonicalPath,
        },
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            type: "website",
            images: image ? [image] : undefined,
        },
        twitter: {
            title,
            description,
            images: image ? [image] : undefined,
        },
    })
}
