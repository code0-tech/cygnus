import type { LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { formatLicenseDisplayValue } from "@/lib/licenses/displayValues"
import type { LicenseDashboardLicense, SubscriptionPendingUpdate } from "@/lib/licenses/types"

type CurrentSelection = Pick<LicenseDashboardLicense, "aiTokens" | "paymentPeriod" | "plan" | "workflowExecutions">

const sameValue = (next: string, current?: string) => next.trim().toLowerCase() === current?.trim().toLowerCase()

export function formatPendingUpdateSelection(update: SubscriptionPendingUpdate | null | undefined, content: LicenseContent, locale: AppLocale, current?: CurrentSelection | null) {
    if (!update) return null

    const selection = [
        update.plan && !sameValue(update.plan, current?.plan) ? formatLicenseDisplayValue(update.plan, "plan", content.values) : null,
        update.paymentPeriod && !sameValue(update.paymentPeriod, current?.paymentPeriod) ? formatLicenseDisplayValue(update.paymentPeriod, "paymentPeriod", content.values) : null,
        typeof update.workflowExecutions === "number" && update.workflowExecutions !== current?.workflowExecutions
            ? `${new Intl.NumberFormat(locale).format(update.workflowExecutions)} ${content.dashboard.workflowExecutionsLabel}`
            : null,
        typeof update.aiTokens === "number" && update.aiTokens !== current?.aiTokens ? `${new Intl.NumberFormat(locale).format(update.aiTokens)} ${content.dashboard.aiTokensLabel}` : null,
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
