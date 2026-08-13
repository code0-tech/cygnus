import type { LicenseContent } from "@/lib/cms"

type LicenseValueCategory = "customerType" | "deploymentType" | "paymentPeriod" | "plan" | "status"

function normalize(value: string | null | undefined) {
    return value?.trim().toLowerCase().replaceAll("-", "_")
}

export function formatLicenseDisplayValue(value: string | null | undefined, category: LicenseValueCategory, labels: LicenseContent["values"]) {
    const normalizedValue = normalize(value)
    if (!normalizedValue) return labels.unknown

    const mappings: Record<LicenseValueCategory, Record<string, string>> = {
        customerType: {
            personal: labels.customerTypes.personal,
            b2c: labels.customerTypes.personal,
            business: labels.customerTypes.business,
            b2b: labels.customerTypes.business,
        },
        deploymentType: {
            cloud: labels.deploymentTypes.cloud,
            self_hosted: labels.deploymentTypes.selfHosted,
        },
        paymentPeriod: {
            weekly: labels.paymentPeriods.weekly,
            monthly: labels.paymentPeriods.monthly,
            quarterly: labels.paymentPeriods.quarterly,
            yearly: labels.paymentPeriods.yearly,
        },
        plan: {
            pro: labels.plans.pro,
            max: labels.plans.max,
            custom: labels.plans.custom,
            custom_plan: labels.plans.custom,
        },
        status: {
            active: labels.statuses.active,
            paid: labels.statuses.paid,
            payment_failed: labels.statuses.paymentFailed,
            canceled: labels.statuses.canceled,
            expired: labels.statuses.expired,
        },
    }

    return mappings[category][normalizedValue] ?? labels.unknown
}
