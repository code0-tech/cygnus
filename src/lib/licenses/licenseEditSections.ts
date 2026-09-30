import type { AppLocale } from "@/lib/i18n"

// Upgrade is always listed first.
export const LICENSE_EDIT_SECTIONS = ["upgrade", "general", "payment"] as const

export type LicenseEditSection = (typeof LICENSE_EDIT_SECTIONS)[number]

export function isLicenseEditSection(value: string | null): value is LicenseEditSection {
    return LICENSE_EDIT_SECTIONS.includes(value as LicenseEditSection)
}

export function getLicenseEditSectionLabels(locale: AppLocale, upgradeTitle: string): Record<LicenseEditSection, string> {
    return locale === "de"
        ? { upgrade: upgradeTitle, general: "Allgemein", payment: "Zahlungsmethode" }
        : { upgrade: upgradeTitle, general: "General", payment: "Payment method" }
}
