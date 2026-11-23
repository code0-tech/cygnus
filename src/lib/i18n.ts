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

// Top-level paths that live outside the localized `[locale]` routes; src/proxy.ts leaves the same paths alone.
const UNLOCALIZED_ROOT_SEGMENTS = new Set(["_next", "admin", "api"])

export function localizeHref(href: string, locale: AppLocale): string {
    // Protocol-relative URLs ("//host/...") point to another origin.
    if (!href.startsWith("/") || href.startsWith("//")) return href

    const segment = href.slice(1).split(/[/?#]/, 1)[0]
    if (segment && (isSupportedLocale(segment) || UNLOCALIZED_ROOT_SEGMENTS.has(segment))) return href
    if (href === "/") return `/${locale}`

    return `/${locale}${href}`
}
