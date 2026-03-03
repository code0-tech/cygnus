export const SUPPORTED_LOCALES = ["en", "de"] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = "en"

export function isSupportedLocale(value: string): value is AppLocale {
    return SUPPORTED_LOCALES.includes(value as AppLocale)
}

function normalizeLocale(value?: string | null): AppLocale {
    if (!value) return DEFAULT_LOCALE
    return isSupportedLocale(value) ? value : DEFAULT_LOCALE
}

export function getLocaleFromPath(pathname: string): AppLocale {
    const [segment] = pathname.split("/").filter(Boolean)
    return normalizeLocale(segment ?? null)
}

export function localizeHref(href: string, locale: AppLocale): string {
    if (!href.startsWith("/")) return href

    const [segment] = href.split("/").filter(Boolean)
    if (segment && isSupportedLocale(segment)) return href
    if (href === "/") return `/${locale}`

    return `/${locale}${href}`
}
