import type { LicenseContent } from "@/lib/cms"

export type CustomerEditSection = "general" | "paymentMethods"

export function getCustomerEditSectionLabels(editor: LicenseContent["editor"]): Record<CustomerEditSection, string> {
    return { general: editor.generalTabLabel, paymentMethods: editor.paymentMethodsTabLabel }
}

// Upgrade is always listed first.
export const LICENSE_EDIT_SECTIONS = ["upgrade", "general", "payment"] as const

export type LicenseEditSection = (typeof LICENSE_EDIT_SECTIONS)[number]

export function isLicenseEditSection(value: string | null): value is LicenseEditSection {
    return LICENSE_EDIT_SECTIONS.includes(value as LicenseEditSection)
}

export function getLicenseEditSectionLabels(content: Pick<LicenseContent, "editor" | "upgrade">): Record<LicenseEditSection, string> {
    return { upgrade: content.upgrade.title, general: content.editor.generalTabLabel, payment: content.editor.paymentMethodTabLabel }
}
