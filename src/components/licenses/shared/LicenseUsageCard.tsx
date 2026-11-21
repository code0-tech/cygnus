"use client"

import { getLicenseDetailGridCellClassName } from "@/components/licenses/shared/licenseDetailGrid"
import type { LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import type { LicenseUsage, LicenseUsageMetric } from "@/lib/licenses/types"
import { formatUsageAmount, formatUsagePercent, getUsagePercent } from "@/lib/licenses/usage"
import { Card, Flex, ProgressLinear, Spacing, Text } from "@code0-tech/pictor"

type UsageContent = Pick<
    LicenseContent["dashboard"],
    | "aiTokensLabel"
    | "usageDescription"
    | "usageExceededLabel"
    | "usageLabel"
    | "usageOfLabel"
    | "usageRemainingLabel"
    | "usageResetsAtLabel"
    | "usageUnavailableDescription"
    | "usageUnlimitedLabel"
    | "usageUpdatedAtLabel"
    | "workflowExecutionsLabel"
>

interface LicenseUsageCardProps {
    content: UsageContent
    locale: AppLocale
    usage: LicenseUsage | undefined
}

function UsageMetric({ content, index, label, locale, metric }: { content: UsageContent; index: number; label: string; locale: AppLocale; metric: LicenseUsageMetric }) {
    const percent = getUsagePercent(metric)
    const used = formatUsageAmount(metric.used, locale)
    const note = metric.exceeded
        ? content.usageExceededLabel
        : metric.remaining !== null
          ? content.usageRemainingLabel.replaceAll("{remaining}", formatUsageAmount(metric.remaining, locale))
          : content.usageUnlimitedLabel

    return (
        <div className={getLicenseDetailGridCellClassName(index)} data-testid="license-usage-metric">
            <Flex align="center" justify="space-between" style={{ gap: "0.5rem" }}>
                <Text size="sm" hierarchy="tertiary" className="truncate">
                    {label}
                </Text>
                {percent !== null ? (
                    <Text size="sm" hierarchy="tertiary" className={metric.exceeded ? "text-error!" : undefined}>
                        {formatUsagePercent(percent, locale)}
                    </Text>
                ) : null}
            </Flex>
            <Flex align="baseline" style={{ gap: "0.5rem" }} className="mt-3 min-w-0">
                <Text fw={400} title={used} className="truncate text-xl! leading-tight! text-white!">
                    {used}
                </Text>
                <Text size="sm" hierarchy="tertiary" className="truncate">
                    {metric.allowance !== null ? content.usageOfLabel.replaceAll("{allowance}", formatUsageAmount(metric.allowance, locale)) : content.usageUnlimitedLabel}
                </Text>
            </Flex>
            {percent !== null ? (
                <ProgressLinear
                    aria-label={label}
                    value={percent}
                    max={100}
                    color={metric.exceeded ? "var(--color-error)" : "var(--color-brand)"}
                    className="mt-3"
                />
            ) : null}
            {metric.allowance !== null ? (
                <Text size="sm" hierarchy="tertiary" display="block" className={metric.exceeded ? "mt-2! text-error!" : "mt-2!"}>
                    {note}
                </Text>
            ) : null}
        </div>
    )
}

/**
 * The current period's consumption of a cloud license. Self-hosted installations report none and an unlinked cloud
 * license has nothing to report yet (the page already asks for a namespace), so both render nothing.
 */
export function LicenseUsageCard({ content, locale, usage }: LicenseUsageCardProps) {
    if (!usage || usage.availability === "unsupported") return null

    // Usage periods end on a UTC day boundary, so the reset date is shown in UTC like the billing dates.
    const resetsAt = usage.resetsAt ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(usage.resetsAt)) : null
    const updatedAt = usage.lastUpdatedAt ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(usage.lastUpdatedAt)) : null
    const metrics = [
        { key: "aiTokens", label: content.aiTokensLabel, metric: usage.aiTokens },
        { key: "workflowExecutions", label: content.workflowExecutionsLabel, metric: usage.workflowExecutions },
    ].flatMap((entry) => (entry.metric ? [{ ...entry, metric: entry.metric }] : []))
    const footer = [resetsAt ? content.usageResetsAtLabel.replaceAll("{date}", resetsAt) : null, updatedAt ? content.usageUpdatedAtLabel.replaceAll("{time}", updatedAt) : null].filter(Boolean)

    return (
        <section aria-labelledby="license-usage-heading">
            <Text id="license-usage-heading" hierarchy="secondary" size="lg">
                {content.usageLabel}
            </Text>
            <Spacing spacing="xs" />
            <Text size="md" hierarchy="tertiary">
                {content.usageDescription}
            </Text>
            <Spacing spacing="md" />
            <Card color="secondary" className="overflow-hidden p-0!">
                {usage.availability === "available" && metrics.length > 0 ? (
                    <div className="grid sm:grid-cols-2">
                        {metrics.map((entry, index) => (
                            <UsageMetric key={entry.key} content={content} index={index} label={entry.label} locale={locale} metric={entry.metric} />
                        ))}
                    </div>
                ) : (
                    // Unavailable is never shown as zero consumption.
                    <div className="px-6 py-5">
                        <Text size="sm" hierarchy="tertiary">
                            {content.usageUnavailableDescription}
                        </Text>
                    </div>
                )}
                {footer.length > 0 ? (
                    <div className="border-t border-white/10 px-6 py-3">
                        <Text size="sm" hierarchy="tertiary">
                            {footer.join(" · ")}
                        </Text>
                    </div>
                ) : null}
            </Card>
        </section>
    )
}
