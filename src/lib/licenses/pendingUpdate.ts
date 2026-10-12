import type { LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { formatLicenseDisplayValue } from "@/lib/licenses/displayValues"
import type { SubscriptionPendingUpdate } from "@/lib/licenses/types"

// Crater only fills the fields of a scheduled change that actually differ, so the selection is assembled from whatever is present.
export function formatPendingUpdateSelection(update: SubscriptionPendingUpdate | null | undefined, content: LicenseContent, locale: AppLocale) {
    if (!update) return null

    const selection = [
        update.plan ? formatLicenseDisplayValue(update.plan, "plan", content.values) : null,
        update.paymentPeriod ? formatLicenseDisplayValue(update.paymentPeriod, "paymentPeriod", content.values) : null,
        typeof update.workflowExecutions === "number" ? `${new Intl.NumberFormat(locale).format(update.workflowExecutions)} ${content.dashboard.workflowExecutionsLabel}` : null,
        typeof update.aiTokens === "number" ? `${new Intl.NumberFormat(locale).format(update.aiTokens)} ${content.dashboard.aiTokensLabel}` : null,
    ]
        .filter(Boolean)
        .join(" · ")

    return selection || null
}

export function parseLicenseDate(value?: string | null) {
    if (!value) return null

    const date = new Date(value)
    return Number.isFinite(date.getTime()) ? date : null
}

// The scheduled change usually lands on the period end, but Crater may schedule it for another day.
export function resolvePendingUpdateDate(update: SubscriptionPendingUpdate | null | undefined, fallback?: string | null) {
    return parseLicenseDate(update?.effectiveAt) ?? parseLicenseDate(fallback)
}
