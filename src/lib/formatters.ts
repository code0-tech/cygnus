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

export function formatCurrency(value: number, currency: string, locale: string) {
    return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
    }).format(value)
}

export function formatMinorCurrency(value: number, currency: string, locale: string) {
    const formatter = new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
    })
    const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2
    return formatter.format(value / 10 ** fractionDigits)
}

export function formatCompactNumber(value: number) {
    const absoluteValue = Math.abs(value)
    const compactUnits = [
        { suffix: "B", value: 1_000_000_000 },
        { suffix: "M", value: 1_000_000 },
        { suffix: "K", value: 1_000 },
    ]
    const unit = compactUnits.find((compactUnit) => absoluteValue >= compactUnit.value)

    if (!unit) return String(value)

    const compactValue = value / unit.value
    const maximumFractionDigits = Number.isInteger(compactValue) ? 0 : 1

    return `${compactValue.toLocaleString("en-US", { maximumFractionDigits })}${unit.suffix}`
}

export function formatLongDate(value: Date, locale: string) {
    return longDateFormatters[getFormatterLocale(locale)].format(value)
}

export function formatMediumDate(value: Date, locale: string) {
    return mediumDateFormatters[getFormatterLocale(locale)].format(value)
}
