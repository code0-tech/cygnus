"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import type { LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { Button, Card, DataTable, DataTableColumn, DataTableHeader, DataTableHeaderColumn, Spacing, Text } from "@code0-tech/pictor"
import { useRouter } from "next/navigation"
import { Fragment } from "react"

interface LicenseDetailPageProps {
    content: LicenseContent
    customerId: string
    licenseId: string
    locale: AppLocale
}

export function LicenseDetailPage({ content, customerId, licenseId, locale }: LicenseDetailPageProps) {
    const router = useRouter()
    const { isLoading, licenses } = useLicenseData()
    const license = licenses.find((candidate) => candidate.id === licenseId && candidate.customerId === customerId)
    const licenseRows = license ? [license] : []
    const dateFormatter = new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeZone: "UTC",
    })

    return (
        <section aria-labelledby="license-heading">
            <Text id="license-heading" hierarchy="secondary" size="lg">
                {license?.name || content.licenses}
            </Text>
            <Spacing spacing="md" />

            <Card color="secondary">
                <DataTable
                    data={licenseRows}
                    loading={isLoading}
                    emptyComponent={
                        <DataTableColumn colSpan={5}>
                            <Text size="sm" hierarchy="tertiary">
                                {content.emptyLicenses}
                            </Text>
                        </DataTableColumn>
                    }
                >
                    <DataTableHeader>
                        <DataTableHeaderColumn>{content.licenses}</DataTableHeaderColumn>
                        <DataTableHeaderColumn>{content.dashboard.statusLabel}</DataTableHeaderColumn>
                        <DataTableHeaderColumn>{content.dashboard.deploymentLabel}</DataTableHeaderColumn>
                        <DataTableHeaderColumn>{content.dashboard.lastEditedLabel}</DataTableHeaderColumn>
                        <DataTableHeaderColumn />
                    </DataTableHeader>
                    {(row) => (
                        <Fragment key={row.id}>
                            <DataTableColumn>
                                <Text size="sm" fw={500}>
                                    {row.name}
                                </Text>
                            </DataTableColumn>
                            <DataTableColumn>
                                <Text size="sm" hierarchy="tertiary">
                                    {row.status || "—"}
                                </Text>
                            </DataTableColumn>
                            <DataTableColumn>
                                <Text size="sm" hierarchy="tertiary">
                                    {row.deploymentType?.replaceAll("_", " ") || "—"}
                                </Text>
                            </DataTableColumn>
                            <DataTableColumn>
                                <Text size="sm" hierarchy="tertiary">
                                    {row.updatedAt ? dateFormatter.format(new Date(row.updatedAt)) : "—"}
                                </Text>
                            </DataTableColumn>
                            <DataTableColumn>
                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        variant="normal"
                                        paddingSize="xs"
                                        onClick={() =>
                                            router.push(
                                                `/${locale}/licenses/customer/${encodeURIComponent(row.customerId)}/license/${encodeURIComponent(row.id)}/edit`
                                            )
                                        }
                                        className="text-sm!"
                                    >
                                        {content.dashboard.editLabel}
                                    </Button>
                                </div>
                            </DataTableColumn>
                        </Fragment>
                    )}
                </DataTable>
            </Card>
        </section>
    )
}
