import { isSupportedLocale, type AppLocale } from "@/lib/i18n"
import { getLandingPageMetadata } from "@/lib/pageMetadata"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export type LocalePageParams = Promise<{ locale: string }>
export type LocaleSlugPageParams = Promise<{ locale: string, slug: string }>

export function requireSupportedLocale(locale: string): AppLocale {
    if (!isSupportedLocale(locale)) {
        notFound()
    }

    return locale
}

export async function getPageLocale(params: LocalePageParams): Promise<AppLocale> {
    const { locale } = await params
    return requireSupportedLocale(locale)
}

export async function getPageLocaleAndSlug(params: LocaleSlugPageParams): Promise<{ locale: AppLocale, slug: string }> {
    const { locale, slug } = await params
    const resolvedLocale = requireSupportedLocale(locale)

    if (!slug?.trim()) {
        notFound()
    }

    return {
        locale: resolvedLocale,
        slug,
    }
}

export function createLandingMetadata(slug: string) {
    return async ({ params }: { params: LocalePageParams }): Promise<Metadata> => {
        const { locale } = await params
        return getLandingPageMetadata(slug, locale)
    }
}
