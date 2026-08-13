"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { LicensePlanIcon } from "@/components/licenses/LicensePlanIcon"
import { LicenseStatusDot } from "@/components/licenses/LicenseStatusDot"
import type { LicenseContent } from "@/lib/cms"
import { formatCompactNumber } from "@/lib/formatters"
import type { AppLocale } from "@/lib/i18n"
import { decodeLicenseRouteId } from "@/lib/licenses/licenseRoute"
import { Button, Card, Flex, Spacing, Text } from "@code0-tech/pictor"
import { useRouter } from "next/navigation"

interface LicenseDetailPageProps {
    content: LicenseContent
    customerId: string
    licenseId: string
    locale: AppLocale
}

export function LicenseDetailPage({ content, customerId, licenseId, locale }: LicenseDetailPageProps) {
    const router = useRouter()
    const { customers, isLoading, licenses } = useLicenseData()
    const resolvedCustomerId = decodeLicenseRouteId(customerId)
    const resolvedLicenseId = decodeLicenseRouteId(licenseId)
    const license = licenses.find((candidate) => candidate.id === resolvedLicenseId && candidate.customerId === resolvedCustomerId)
    const customer = customers.find((candidate) => candidate.id === resolvedCustomerId)
    const dateFormatter = new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeZone: "UTC",
    })
    const licenseDetails = license
        ? [
              { label: content.dashboard.statusLabel, value: license.status?.replaceAll("_", " ") || "—", showStatusDot: true },
              { label: content.dashboard.typeLabel, value: customer?.customerType?.replaceAll("_", " ") || license.customerType?.replaceAll("_", " ") || "—" },
              { label: content.dashboard.deploymentLabel, value: license.deploymentType?.replaceAll("_", " ") || "—" },
              { label: content.licenses, value: license.plan?.replaceAll("_", " ") || license.name, showPlanIcon: true },
              { label: content.dashboard.paymentPeriodLabel, value: license.paymentPeriod?.replaceAll("_", " ") || "—" },
              ...(license.plan?.toLowerCase() === "custom"
                  ? [
                        { label: content.dashboard.workflowExecutionsLabel, value: license.workflowExecutions === undefined ? "—" : formatCompactNumber(license.workflowExecutions) },
                        { label: content.dashboard.aiTokensLabel, value: license.aiTokens === undefined ? "—" : formatCompactNumber(license.aiTokens) },
                    ]
                  : []),
              { label: content.editor.namespaceLabel, value: license.namespaceId || "—" },
              {
                  label: content.dashboard.lastEditedLabel,
                  value: license.updatedAt ? dateFormatter.format(new Date(license.updatedAt)) : "—",
              },
          ]
        : []

    return (
        <section aria-labelledby="license-heading">
            <Flex align="center" justify="space-between" style={{ gap: "1rem" }}>
                <Text id="license-heading" hierarchy="secondary" size="lg">
                    {locale === "de" ? "Lizenz" : "License"}
                </Text>
                {isLoading || license ? (
                    <Button
                        type="button"
                        variant="normal"
                        paddingSize="xs"
                        disabled={isLoading || !license}
                        onClick={() => {
                            if (!license) return
                            router.push(`/${locale}/licenses/customer/${encodeURIComponent(license.customerId)}/license/${encodeURIComponent(license.id)}/edit`)
                        }}
                        className="shrink-0 text-sm!"
                    >
                        {content.dashboard.editLabel}
                    </Button>
                ) : null}
            </Flex>
            <Spacing spacing="md" />

            <Card color="secondary">
                {license ? (
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                        {licenseDetails.map((detail) => (
                            <div key={detail.label} className="min-w-0">
                                <Text size="sm" hierarchy="tertiary">
                                    {detail.label}
                                </Text>
                                <Spacing spacing="xxs" />
                                <Flex align="center" style={{ gap: "0.25rem" }}>
                                    {"showStatusDot" in detail ? <LicenseStatusDot aria-hidden="true" status={license.status} /> : null}
                                    {"showPlanIcon" in detail ? <LicensePlanIcon className="shrink-0 text-brand" plan={license.plan} size={16} /> : null}
                                    <Text size="sm" fw={500} className="wrap-break-word capitalize">
                                        {detail.value}
                                    </Text>
                                </Flex>
                            </div>
                        ))}
                    </div>
                ) : isLoading ? (
                    <div aria-hidden="true" className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                        {Array.from({ length: 9 }, (_, index) => (
                            <div key={index} className="min-w-0 animate-pulse motion-reduce:animate-none">
                                <div className={index % 3 === 0 ? "h-3 w-20 rounded-full bg-white/10" : "h-3 w-28 rounded-full bg-white/10"} />
                                <Spacing spacing="xxs" />
                                <div className={index % 2 === 0 ? "h-4 w-24 rounded-full bg-white/10" : "h-4 w-16 rounded-full bg-white/10"} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <Text size="sm" hierarchy="tertiary">
                        {content.emptyLicenses}
                    </Text>
                )}
            </Card>
        </section>
    )
}
