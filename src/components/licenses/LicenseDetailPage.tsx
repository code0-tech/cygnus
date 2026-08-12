"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import type { LicenseContent } from "@/lib/cms"
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
    const { isLoading, licenses } = useLicenseData()
    const resolvedCustomerId = decodeLicenseRouteId(customerId)
    const resolvedLicenseId = decodeLicenseRouteId(licenseId)
    const license = licenses.find((candidate) => candidate.id === resolvedLicenseId && candidate.customerId === resolvedCustomerId)
    const dateFormatter = new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeZone: "UTC",
    })
    const licenseDetails = license
        ? [
              { label: content.dashboard.statusLabel, value: license.status?.replaceAll("_", " ") || "—" },
              { label: content.dashboard.deploymentLabel, value: license.deploymentType?.replaceAll("_", " ") || "—" },
              { label: content.licenses, value: license.plan?.replaceAll("_", " ") || license.name },
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
                {license ? (
                    <Button
                        type="button"
                        variant="normal"
                        paddingSize="xs"
                        onClick={() => router.push(`/${locale}/licenses/customer/${encodeURIComponent(license.customerId)}/license/${encodeURIComponent(license.id)}/edit`)}
                        className="shrink-0 text-sm!"
                    >
                        {content.dashboard.editLabel}
                    </Button>
                ) : null}
            </Flex>
            <Spacing spacing="md" />

            <Card color="secondary">
                {license ? (
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
                        {licenseDetails.map((detail) => (
                            <div key={detail.label} className="min-w-0">
                                <Text size="sm" hierarchy="tertiary">
                                    {detail.label}
                                </Text>
                                <Spacing spacing="xxs" />
                                <Text size="sm" fw={500} className="break-words capitalize">
                                    {detail.value}
                                </Text>
                            </div>
                        ))}
                    </div>
                ) : isLoading ? (
                    <div className="h-14 animate-pulse rounded-xl bg-white/[0.04] motion-reduce:animate-none" />
                ) : (
                    <Text size="sm" hierarchy="tertiary">
                        {content.emptyLicenses}
                    </Text>
                )}
            </Card>
        </section>
    )
}
