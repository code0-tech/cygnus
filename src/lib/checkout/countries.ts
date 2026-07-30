import type { AppLocale } from "@/lib/i18n"
import countries from "i18n-iso-countries"
import de from "i18n-iso-countries/langs/de.json"
import en from "i18n-iso-countries/langs/en.json"

countries.registerLocale(de)
countries.registerLocale(en)

export interface CountryOption {
    label: string
    searchValue: string
    value: string
}

export function normalizeCountrySearchValue(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/\p{M}/gu, "")
        .toLocaleLowerCase()
}

export function getCountryOptions(locale: AppLocale): CountryOption[] {
    const collator = new Intl.Collator(locale, { sensitivity: "base" })
    const germanNames = countries.getNames("de", { select: "official" })
    const englishNames = countries.getNames("en", { select: "official" })

    return Object.entries(countries.getNames(locale, { select: "official" }))
        .map(([value, label]) => ({
            label,
            searchValue: normalizeCountrySearchValue([label, germanNames[value], englishNames[value], value].filter(Boolean).join(" ")),
            value,
        }))
        .sort((left, right) => collator.compare(left.label, right.label))
}
