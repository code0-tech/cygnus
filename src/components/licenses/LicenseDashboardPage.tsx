"use client"

import type { License } from "@/components/licenses/LicenseSidebar"
import type { LicenseContent } from "@/lib/cms"
import { AppLocale } from "@/lib/i18n"
import { Card, DataTable, DataTableColumn, DataTableHeader, DataTableHeaderColumn, Flex, Spacing, Text } from "@code0-tech/pictor"
import { IconChevronRight, IconCreditCard, IconFileInvoice, IconKey, IconReceipt } from "@tabler/icons-react"
import Link from "next/link"
import type { ReactNode } from "react"

interface LicenseDashboardPageProps {
    content: LicenseContent
    customers?: LicenseCustomer[]
    locale: AppLocale
    licenses?: License[]
}

export interface LicenseCustomer {
    email?: string
    id: string
    licenseCount: number
    name: string
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
    return (
        <Flex style={{ flex: 1, minWidth: 0, flexDirection: "column", gap: "0.7rem" }}>
            <Flex align="center" justify="space-between" style={{ gap: "0.5rem" }}>
                <Text size="sm" hierarchy="tertiary">
                    {label}
                </Text>
                <span className="text-tertiary">{icon}</span>
            </Flex>
            <Text fz={3} fw={600} style={{ lineHeight: 0.9 }}>
                {value}
            </Text>
        </Flex>
    )
}

export function LicenseDashboardPage({ content, customers = [], locale, licenses = [] }: LicenseDashboardPageProps) {
    const dateFormatter = new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeZone: "UTC",
    })
    const recentlyEditedLicenses = licenses
        .toSorted((left, right) => Date.parse(right.updatedAt ?? "") - Date.parse(left.updatedAt ?? ""))
        .slice(0, 5)
    const metrics = [
        { icon: <IconKey aria-hidden="true" size={14} />, label: content.licenses, value: licenses.length },
        { icon: <IconReceipt aria-hidden="true" size={14} />, label: content.dashboard.customers, value: customers.length },
        { icon: <IconCreditCard aria-hidden="true" size={14} />, label: content.dashboard.paymentProfiles, value: 0 },
        { icon: <IconFileInvoice aria-hidden="true" size={14} />, label: content.dashboard.invoices, value: 0 },
    ]

    return (
        <>
            <Card color="secondary">
                <Flex align="center">
                    {metrics.map((metric, index) => (
                        <div key={metric.label} className="contents">
                            <Metric {...metric} />
                            {index < metrics.length - 1 && (
                                <div
                                    aria-hidden="true"
                                    style={{
                                        width: 1,
                                        alignSelf: "stretch",
                                        background: "rgba(255,255,255,0.08)",
                                        margin: "0 1.5rem",
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </Flex>
            </Card>

            <Spacing spacing="xl" />

            <section aria-labelledby="customers-heading">
                <Flex align="center" style={{ gap: "0.5rem" }}>
                    <Text id="customers-heading" hierarchy="secondary" size="lg">
                        {content.dashboard.customers}
                    </Text>
                    <span className="inline-flex w-fit items-center rounded-full bg-[#191825] px-[0.35rem] py-[0.1167rem] text-[0.7rem] font-normal tracking-[-0.5px] text-white/75 shadow-[inset_0_1px_1px_rgba(191,191,191,0.1)]">
                        {customers.length}
                    </span>
                </Flex>
                <Spacing spacing="md" />

                <Card color="secondary">
                    <DataTable data={customers} emptyComponent={<DataTableColumn colSpan={3}><Text size="sm" hierarchy="tertiary">{content.dashboard.emptyCustomers}</Text></DataTableColumn>}>
                        <DataTableHeader>
                            <DataTableHeaderColumn>{content.dashboard.customerLabel}</DataTableHeaderColumn>
                            <DataTableHeaderColumn>{content.dashboard.emailLabel}</DataTableHeaderColumn>
                            <DataTableHeaderColumn>{content.licenses}</DataTableHeaderColumn>
                        </DataTableHeader>
                        {(customer) => (
                            <>
                                <DataTableColumn>
                                    <Link href={`/${locale}/licenses/customer/${encodeURIComponent(customer.id)}`} className="font-medium text-white hover:text-brand">
                                        {customer.name}
                                    </Link>
                                </DataTableColumn>
                                <DataTableColumn><Text size="sm" hierarchy="tertiary">{customer.email || "—"}</Text></DataTableColumn>
                                <DataTableColumn>{customer.licenseCount}</DataTableColumn>
                            </>
                        )}
                    </DataTable>
                </Card>
            </section>

            <Spacing spacing="xl" />

            <section aria-labelledby="recent-licenses-heading">
                <Text id="recent-licenses-heading" hierarchy="secondary" size="lg">
                    {content.dashboard.recentLicenses}
                </Text>
                <Spacing spacing="xs" />
                <Text size="md" hierarchy="tertiary" maw="50%">
                    {content.dashboard.description}
                </Text>
                <Spacing spacing="md" />

                <Card color="secondary">
                    <DataTable data={recentlyEditedLicenses} emptyComponent={<DataTableColumn colSpan={3}><Text size="sm" hierarchy="tertiary">{content.emptyLicenses}</Text></DataTableColumn>}>
                        <DataTableHeader>
                            <DataTableHeaderColumn>{content.licenses}</DataTableHeaderColumn>
                            <DataTableHeaderColumn>{content.dashboard.customerLabel}</DataTableHeaderColumn>
                            <DataTableHeaderColumn>{content.dashboard.lastEditedLabel}</DataTableHeaderColumn>
                        </DataTableHeader>
                        {(license) => (
                            <>
                                <DataTableColumn>
                                    <Flex align="center" style={{ gap: "0.6rem" }}>
                                        <IconKey aria-hidden="true" className="text-brand" size={15} />
                                        <Text size="sm" fw={500}>{license.name}</Text>
                                    </Flex>
                                </DataTableColumn>
                                <DataTableColumn><Text size="sm" hierarchy="tertiary">{license.customerName || "—"}</Text></DataTableColumn>
                                <DataTableColumn>
                                    <Flex align="center" justify="flex-end" style={{ gap: "0.5rem" }}>
                                        <Text size="sm" hierarchy="tertiary">{license.updatedAt ? dateFormatter.format(new Date(license.updatedAt)) : "—"}</Text>
                                        {license.customerId && (
                                            <Link href={`/${locale}/licenses/customer/${encodeURIComponent(license.customerId)}/license/${encodeURIComponent(license.id)}`} aria-label={license.name} className="text-tertiary hover:text-white">
                                                <IconChevronRight aria-hidden="true" size={15} />
                                            </Link>
                                        )}
                                    </Flex>
                                </DataTableColumn>
                            </>
                        )}
                    </DataTable>
                </Card>
            </section>
        </>
    )
}
