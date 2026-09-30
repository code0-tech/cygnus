import type { AppLocale } from "@/lib/i18n"

export type CustomerEditSection = "general" | "paymentMethods"

export function getCustomerEditSectionLabels(locale: AppLocale): Record<CustomerEditSection, string> {
    return locale === "de" ? { general: "Allgemein", paymentMethods: "Zahlungsmethoden" } : { general: "General", paymentMethods: "Payment methods" }
}
