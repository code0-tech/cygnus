"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import type { LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { Button, Card, DataTable, DataTableColumn, DataTableHeader, DataTableHeaderColumn, Spacing, Text } from "@code0-tech/pictor"
import { Fragment } from "react"
import { useRouter } from "next/navigation"

interface LicenseCustomerPageProps {
    content: LicenseContent
    customerId: string
    locale: AppLocale
}

export function LicenseCustomerPage({ content, customerId, locale }: LicenseCustomerPageProps) {
    const router = useRouter()
    const { customers, isLoading } = useLicenseData()
    const customer = customers.find((candidate) => candidate.id === customerId)
    const customerRows = customer ? [customer] : []

    return (
        <section aria-labelledby="customer-heading">
            <Text id="customer-heading" hierarchy="secondary" size="lg">
                {customer?.name || customer?.email || content.dashboard.customerLabel}
            </Text>
            <Spacing spacing="md" />

            <Card color="secondary">
                <DataTable
                    data={customerRows}
                    loading={isLoading}
                    emptyComponent={
                        <DataTableColumn colSpan={4}>
                            <Text size="sm" hierarchy="tertiary">
                                {content.dashboard.emptyCustomers}
                            </Text>
                        </DataTableColumn>
                    }
                >
                    <DataTableHeader>
                        <DataTableHeaderColumn>{content.dashboard.customerLabel}</DataTableHeaderColumn>
                        <DataTableHeaderColumn>{content.dashboard.emailLabel}</DataTableHeaderColumn>
                        <DataTableHeaderColumn>{content.licenses}</DataTableHeaderColumn>
                        <DataTableHeaderColumn />
                    </DataTableHeader>
                    {(row) => (
                        <Fragment key={row.id}>
                            <DataTableColumn>
                                <Text size="sm" fw={500}>
                                    {row.name || row.email || row.id}
                                </Text>
                            </DataTableColumn>
                            <DataTableColumn>
                                <Text size="sm" hierarchy="tertiary">
                                    {row.email || "—"}
                                </Text>
                            </DataTableColumn>
                            <DataTableColumn>{row.licenseCount}</DataTableColumn>
                            <DataTableColumn>
                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        variant="normal"
                                        paddingSize="xs"
                                        onClick={() => router.push(`/${locale}/licenses/customer/${encodeURIComponent(row.id)}/edit`)}
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
