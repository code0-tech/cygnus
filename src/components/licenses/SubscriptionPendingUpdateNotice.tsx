import type { LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { formatLicenseDisplayValue } from "@/lib/licenses/licenseDisplayValues"
import type { SubscriptionPendingUpdate } from "@/lib/licenses/licenseTypes"

export function SubscriptionPendingUpdateNotice({ update, content, locale }: { update?: SubscriptionPendingUpdate | null; content: LicenseContent; locale: AppLocale }) {
    if (!update) return null
    const selection = [
        update.plan ? formatLicenseDisplayValue(update.plan, "plan", content.values) : null,
        update.paymentPeriod ? formatLicenseDisplayValue(update.paymentPeriod, "paymentPeriod", content.values) : null,
        typeof update.workflowExecutions === "number" ? `${new Intl.NumberFormat(locale).format(update.workflowExecutions)} ${content.dashboard.workflowExecutionsLabel}` : null,
        typeof update.aiTokens === "number" ? `${new Intl.NumberFormat(locale).format(update.aiTokens)} ${content.dashboard.aiTokensLabel}` : null,
    ]
        .filter(Boolean)
        .join(" · ")
    const effectiveAt = update.effectiveAt ? new Date(update.effectiveAt) : null
    const date = effectiveAt && Number.isFinite(effectiveAt.getTime()) ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(effectiveAt) : content.values.unknown
    return (
        <p role="status" className="my-4 rounded-lg border border-white/10 p-4 text-sm text-secondary">
            {content.subscriptionPreview.pendingChangeText.replaceAll("{selection}", selection || content.values.unknown).replaceAll("{date}", date)}
        </p>
    )
}
