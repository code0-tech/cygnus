const euroCurrencyFormatters = {
    de: new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2,
    }),
    en: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2,
    }),
}

const longDateFormatters = {
    de: new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }),
    en: new Intl.DateTimeFormat("en-US", { dateStyle: "long" }),
}

const mediumDateFormatters = {
    de: new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }),
    en: new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }),
}

const getFormatterLocale = (locale: string) => (locale === "de" ? "de" : "en")

export function formatEuroCurrency(value: number, locale: string) {
    return euroCurrencyFormatters[getFormatterLocale(locale)].format(value)
}

export function formatLongDate(value: Date, locale: string) {
    return longDateFormatters[getFormatterLocale(locale)].format(value)
}

export function formatMediumDate(value: Date, locale: string) {
    return mediumDateFormatters[getFormatterLocale(locale)].format(value)
}
