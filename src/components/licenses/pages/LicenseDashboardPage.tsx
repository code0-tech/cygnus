"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import {
    LicenseDataTable as DataTable,
    LicenseDataTableColumn as DataTableColumn,
    LicenseDataTableHeader as DataTableHeader,
    LicenseDataTableHeaderColumn as DataTableHeaderColumn,
} from "@/components/licenses/LicenseDataTable"
import type { LicenseContent } from "@/lib/cms"
import { AppLocale } from "@/lib/i18n"
import { Card, Flex, Spacing, Text } from "@code0-tech/pictor"
import { IconKey } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { Fragment } from "react"
import { LicensePlanIcon } from "../LicensePlanIcon"

interface LicenseDashboardPageProps {
    content: LicenseContent
    locale: AppLocale
}

export function LicenseDashboardPage({ content, locale }: LicenseDashboardPageProps) {
    const router = useRouter()
    const { customers, isLoading, licenses } = useLicenseData()
    const dateFormatter = new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeZone: "UTC",
    })
    const recentlyEditedLicenses = licenses.toSorted((left, right) => Date.parse(right.updatedAt ?? "") - Date.parse(left.updatedAt ?? "")).slice(0, 5)

    return (
        <>
            <section aria-labelledby="customers-heading">
                <Flex align="center" style={{ gap: "0.5rem" }}>
                    <Text id="customers-heading" hierarchy="secondary" size="lg">
                        {content.dashboard.customers}
                    </Text>
                    {isLoading ? (
                        <span aria-hidden="true" className="h-5 w-6 animate-pulse rounded-full bg-white/10 motion-reduce:animate-none" />
                    ) : (
                        <span className="inline-flex w-fit items-center rounded-full bg-[#191825] px-[0.35rem] py-[0.1167rem] text-[0.7rem] font-normal tracking-[-0.5px] text-white/75 shadow-[inset_0_1px_1px_rgba(191,191,191,0.1)]">
                            {customers.length}
                        </span>
                    )}
                </Flex>
                <Spacing spacing="md" />

                <Card color="secondary">
                    <DataTable
                        data={customers}
                        loading={isLoading}
                        onRowClick={(customer) => router.push(`/${locale}/licenses/customer/${encodeURIComponent(customer.id)}`)}
                        rowKey={(customer) => customer.id}
                        emptyComponent={
                            <DataTableColumn colSpan={3}>
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
                        </DataTableHeader>
                        {(customer) => (
                            <Fragment key={customer.id}>
                                <DataTableColumn>
                                    <Text size="sm" fw={500}>
                                        {customer.name || customer.email || customer.id}
                                    </Text>
                                </DataTableColumn>
                                <DataTableColumn>
                                    <Text size="sm" hierarchy="tertiary">
                                        {customer.email || "—"}
                                    </Text>
                                </DataTableColumn>
                                <DataTableColumn>{customer.licenseCount}</DataTableColumn>
                            </Fragment>
                        )}
                    </DataTable>
                </Card>
            </section>

            <Spacing spacing="xl" />

            <section aria-labelledby="recent-licenses-heading">
                <Text id="recent-licenses-heading" hierarchy="secondary" size="lg">
                    {content.dashboard.recentLicenses}
                </Text>
                <Spacing spacing="md" />

                <Card color="secondary">
                    <DataTable
                        data={recentlyEditedLicenses}
                        loading={isLoading}
                        onRowClick={(license) => router.push(`/${locale}/licenses/customer/${encodeURIComponent(license.customerId)}/license/${encodeURIComponent(license.id)}`)}
                        rowKey={(license) => license.id}
                        emptyComponent={
                            <DataTableColumn colSpan={3}>
                                <Text size="sm" hierarchy="tertiary">
                                    {content.emptyLicenses}
                                </Text>
                            </DataTableColumn>
                        }
                    >
                        <DataTableHeader>
                            <DataTableHeaderColumn>{content.licenses}</DataTableHeaderColumn>
                            <DataTableHeaderColumn>{content.dashboard.customerLabel}</DataTableHeaderColumn>
                            <DataTableHeaderColumn>{content.dashboard.lastEditedLabel}</DataTableHeaderColumn>
                        </DataTableHeader>
                        {(license) => (
                            <Fragment key={license.id}>
                                <DataTableColumn>
                                    <Flex align="center" style={{ gap: "0.6rem" }}>
                                        <LicensePlanIcon plan={license.plan} className="text-brand" size={15} />
                                        <Text size="sm" fw={500}>
                                            {license.name}
                                        </Text>
                                    </Flex>
                                </DataTableColumn>
                                <DataTableColumn>
                                    <Text size="sm" hierarchy="tertiary">
                                        {license.customerName || "—"}
                                    </Text>
                                </DataTableColumn>
                                <DataTableColumn>
                                    <Text size="sm" hierarchy="tertiary">
                                        {license.updatedAt ? dateFormatter.format(new Date(license.updatedAt)) : "—"}
                                    </Text>
                                </DataTableColumn>
                            </Fragment>
                        )}
                    </DataTable>
                </Card>
            </section>
        </>
    )
}
