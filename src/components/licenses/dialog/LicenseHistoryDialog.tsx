"use client"

import { LicenseDialog } from "@/components/licenses/dialog/LicenseDialog"
import { LicensePlanIcon } from "@/components/licenses/LicensePlanIcon"
import { LicenseStatusDot } from "@/components/licenses/LicenseStatusDot"
import type { LicenseContent } from "@/lib/cms"
import { formatCompactNumber } from "@/lib/formatters"
import type { AppLocale } from "@/lib/i18n"
import { decodeLicenseRouteId } from "@/lib/licenses/licenseRoute"
import { formatLicenseDisplayValue } from "@/lib/licenses/licenseDisplayValues"
import { getLicenseHistoryContent } from "@/lib/licenses/licenseHistoryContent"
import type { LicenseHistoryData, LicenseHistorySnapshot } from "@/lib/licenses/licenseTypes"
import { Card, Flex, Spacing, Text } from "@code0-tech/pictor"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface LicenseHistoryDialogProps {
    content: LicenseContent
    customerId: string
    licenseId: string
    locale: AppLocale
}

export function LicenseHistoryDialog({ content, customerId, licenseId, locale }: LicenseHistoryDialogProps) {
    const router = useRouter()
    const resolvedCustomerId = decodeLicenseRouteId(customerId)
    const resolvedLicenseId = decodeLicenseRouteId(licenseId)
    const historyContent = getLicenseHistoryContent(locale)
    const [snapshots, setSnapshots] = useState<LicenseHistorySnapshot[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(false)
    const close = () => router.replace(`/${locale}/licenses/customer/${encodeURIComponent(resolvedCustomerId)}/license/${encodeURIComponent(resolvedLicenseId)}`)
    const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" })

    useEffect(() => {
        const controller = new AbortController()

        const loadHistory = async () => {
            setIsLoading(true)
            setError(false)

            try {
                const loaded: LicenseHistorySnapshot[] = []
                let historyAfter: string | null = null
                const seenCursors = new Set<string>()

                while (true) {
                    const params = new URLSearchParams({ view: "history", customerId: resolvedCustomerId, licenseId: resolvedLicenseId })
                    if (historyAfter) params.set("historyAfter", historyAfter)

                    const response = await fetch(`/api/crater/licenses?${params.toString()}`, {
                        credentials: "same-origin",
                        signal: controller.signal,
                    })
                    if (!response.ok) throw new Error(historyContent.loadError)

                    const page = (await response.json()) as LicenseHistoryData
                    loaded.push(...page.snapshots.filter((snapshot) => !loaded.some((candidate) => candidate.id === snapshot.id)))
                    if (!page.pagination.hasNextPage) break
                    if (!page.pagination.endCursor || seenCursors.has(page.pagination.endCursor)) throw new Error(historyContent.loadError)

                    seenCursors.add(page.pagination.endCursor)
                    historyAfter = page.pagination.endCursor
                }

                setSnapshots(loaded)
            } catch (loadError) {
                if (loadError instanceof DOMException && loadError.name === "AbortError") return
                setError(true)
            } finally {
                if (!controller.signal.aborted) setIsLoading(false)
            }
        }

        void loadHistory()
        return () => controller.abort()
    }, [historyContent.loadError, resolvedCustomerId, resolvedLicenseId])

    const formatDate = (value?: string) => (value ? dateFormatter.format(new Date(value)) : "—")
    const formatValidity = (snapshot: LicenseHistorySnapshot) => {
        if (!snapshot.startDate && !snapshot.endDate) return "—"
        return `${formatDate(snapshot.startDate)} – ${formatDate(snapshot.endDate)}`
    }

    return (
        <LicenseDialog backLabel={content.editor.closeLabel} description={historyContent.description} onClose={close} title={historyContent.title}>
            {isLoading ? (
                <Text size="sm" hierarchy="tertiary">
                    {content.pagination.loadingLabel}
                </Text>
            ) : error ? (
                <Text role="alert" size="sm" className="text-error!">
                    {historyContent.loadError}
                </Text>
            ) : snapshots.length === 0 ? (
                <Text size="sm" hierarchy="tertiary">
                    {historyContent.empty}
                </Text>
            ) : (
                <ol className="space-y-3">
                    {snapshots.map((snapshot, index) => {
                        const isCurrent = snapshot.id === resolvedLicenseId || (index === 0 && !snapshots.some((candidate) => candidate.id === resolvedLicenseId))
                        return (
                            <li key={snapshot.id}>
                                <Card color="secondary" className="relative overflow-hidden">
                                    <Flex align="center" justify="space-between" style={{ gap: "1rem" }}>
                                        <Flex align="center" style={{ gap: "0.5rem" }}>
                                            <LicensePlanIcon className="shrink-0 text-brand" plan={snapshot.plan} size={18} />
                                            <Text fw={500}>{formatLicenseDisplayValue(snapshot.plan, "plan", content.values)}</Text>
                                        </Flex>
                                        {isCurrent ? (
                                            <Text size="xs" fw={500} className="rounded-full bg-white/8 px-2 py-1 text-brand!">
                                                {historyContent.currentLabel}
                                            </Text>
                                        ) : null}
                                    </Flex>
                                    <Spacing spacing="md" />
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <Text size="sm" hierarchy="tertiary">
                                                {content.dashboard.statusLabel}
                                            </Text>
                                            <Spacing spacing="xxs" />
                                            <Flex align="center" style={{ gap: "0.4rem" }}>
                                                <LicenseStatusDot aria-hidden="true" status={snapshot.status} />
                                                <Text size="sm" fw={500}>
                                                    {formatLicenseDisplayValue(snapshot.status, "status", content.values)}
                                                </Text>
                                            </Flex>
                                        </div>
                                        <HistoryValue label={historyContent.validityLabel} value={formatValidity(snapshot)} />
                                        <HistoryValue label={content.dashboard.paymentPeriodLabel} value={formatLicenseDisplayValue(snapshot.paymentPeriod, "paymentPeriod", content.values)} />
                                        <HistoryValue label={historyContent.createdLabel} value={formatDate(snapshot.createdAt ?? snapshot.updatedAt)} />
                                        {snapshot.plan?.toLowerCase() === "custom" ? (
                                            <>
                                                <HistoryValue
                                                    label={content.dashboard.workflowExecutionsLabel}
                                                    value={snapshot.workflowExecutions === undefined ? "—" : formatCompactNumber(snapshot.workflowExecutions)}
                                                />
                                                <HistoryValue label={content.dashboard.aiTokensLabel} value={snapshot.aiTokens === undefined ? "—" : formatCompactNumber(snapshot.aiTokens)} />
                                            </>
                                        ) : null}
                                    </div>
                                </Card>
                            </li>
                        )
                    })}
                </ol>
            )}
        </LicenseDialog>
    )
}

function HistoryValue({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <Text size="sm" hierarchy="tertiary">
                {label}
            </Text>
            <Spacing spacing="xxs" />
            <Text size="sm" fw={500} className="wrap-break-word">
                {value}
            </Text>
        </div>
    )
}
