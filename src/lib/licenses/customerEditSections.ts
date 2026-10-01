import type { LicenseContent } from "@/lib/cms"

export type CustomerEditSection = "general" | "paymentMethods"

export function getCustomerEditSectionLabels(editor: LicenseContent["editor"]): Record<CustomerEditSection, string> {
    return { general: editor.generalTabLabel, paymentMethods: editor.paymentMethodsTabLabel }
}
