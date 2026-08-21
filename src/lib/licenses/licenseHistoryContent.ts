import type { AppLocale } from "@/lib/i18n"

export interface LicenseHistoryContent {
    buttonLabel: string
    createdLabel: string
    currentLabel: string
    description: string
    empty: string
    loadError: string
    title: string
    validityLabel: string
}

const content: Record<AppLocale, LicenseHistoryContent> = {
    en: {
        buttonLabel: "View history",
        createdLabel: "Created",
        currentLabel: "Current",
        description: "All snapshots created for this subscription, newest first.",
        empty: "No license history available.",
        loadError: "The license history could not be loaded.",
        title: "License history",
        validityLabel: "Validity",
    },
    de: {
        buttonLabel: "Verlauf anzeigen",
        createdLabel: "Erstellt",
        currentLabel: "Aktuell",
        description: "Alle für dieses Abonnement erstellten Lizenzstände, beginnend mit dem neuesten.",
        empty: "Kein Lizenzverlauf verfügbar.",
        loadError: "Der Lizenzverlauf konnte nicht geladen werden.",
        title: "Lizenzverlauf",
        validityLabel: "Gültigkeit",
    },
}

export function getLicenseHistoryContent(locale: AppLocale) {
    return content[locale]
}
