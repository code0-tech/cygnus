"use client"

import { useLicenseData } from "@/components/licenses/data/LicenseDataProvider"
import { getLicenseStatusBadgeColor } from "@/components/licenses/shared/LicenseStatusDot"
import { LicenseLoadMoreButton } from "@/components/licenses/table/LicenseLoadMoreButton"
import { LicenseDataTableSkeleton } from "@/components/licenses/table/LicenseDataTableSkeleton"
import { LICENSE_DATA_TABLE_PAGE_SIZE, LicenseDataTablePagination } from "@/components/licenses/table/LicenseDataTablePagination"
import { PICTOR_BADGE_CLASS_NAME, StableBadge } from "@/components/ui/StableBadge"
import type { LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { formatLicenseDisplayValue, formatLicenseEdition } from "@/lib/licenses/displayValues"
import { createLicenseCustomerPath, createLicensePath } from "@/lib/licenses/routes"
import { AutoScrollArea, Badge, Card, DataTable, DataTableColumn, DataTableHeader, DataTableHeaderColumn, Flex, Spacing, Text } from "@code0-tech/pictor"
import { useRouter } from "next/navigation"
import { Fragment } from "react"

const RECENT_LICENSE_COUNT = 5

interface LicenseIndexPageProps {
    content: LicenseContent
    locale: AppLocale
}

export function LicenseIndexPage({ content, locale }: LicenseIndexPageProps) {
    const router = useRouter()
    const { customers, isLoading, loadMore, loadingMore, pagination, sidebarLicenses } = useLicenseData()
    const recentLicenses = sidebarLicenses.toSorted((left, right) => (Date.parse(right.updatedAt ?? "") || 0) - (Date.parse(left.updatedAt ?? "") || 0)).slice(0, RECENT_LICENSE_COUNT)
    const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" })

    const customerTableHeader = (
        <DataTableHeader>
            <DataTableHeaderColumn className="text-xs font-normal text-tertiary">{content.dashboard.customerLabel}</DataTableHeaderColumn>
            <DataTableHeaderColumn className="text-xs font-normal text-tertiary">{content.dashboard.typeLabel}</DataTableHeaderColumn>
            <DataTableHeaderColumn className="text-xs font-normal text-tertiary">{content.dashboard.emailLabel}</DataTableHeaderColumn>
            <DataTableHeaderColumn className="text-xs font-normal text-tertiary">{content.licenses}</DataTableHeaderColumn>
        </DataTableHeader>
    )

    const recentLicenseTableHeader = (
        <DataTableHeader>
            <DataTableHeaderColumn className="text-xs font-normal text-tertiary">{content.licenses}</DataTableHeaderColumn>
            <DataTableHeaderColumn className="text-xs font-normal text-tertiary">{content.dashboard.customerLabel}</DataTableHeaderColumn>
            <DataTableHeaderColumn className="text-xs font-normal text-tertiary">{content.dashboard.statusLabel}</DataTableHeaderColumn>
            <DataTableHeaderColumn className="text-xs font-normal text-tertiary">{content.dashboard.editionLabel}</DataTableHeaderColumn>
            <DataTableHeaderColumn className="text-xs font-normal text-tertiary">{content.dashboard.lastEditedLabel}</DataTableHeaderColumn>
        </DataTableHeader>
    )

    return (
        <div>
            <section aria-labelledby="customers-heading">
                <Flex align="center" style={{ gap: "0.5rem" }}>
                    <Text id="customers-heading" hierarchy="secondary" size="lg">
                        {content.dashboard.customersLabel}
                    </Text>
                    {isLoading ? null : (
                        <StableBadge color="secondary" className={PICTOR_BADGE_CLASS_NAME}>
                            {pagination?.customers?.totalCount ?? customers.length}
                        </StableBadge>
                    )}
                </Flex>
                <Spacing spacing="xs" />
                <Text size="md" hierarchy="tertiary" maw="50%">
                    {content.dashboard.customersDescription}
                </Text>
                <Spacing spacing="md" />

                <Card color="secondary" className="pt-2!">
                    <AutoScrollArea mah="28rem" type="scroll">
                        {isLoading ? (
                            <LicenseDataTableSkeleton header={customerTableHeader} widths={["w-28", "w-16", "w-36", "w-6"]} />
                        ) : (
                            <DataTable
                                data={customers}
                                limit={LICENSE_DATA_TABLE_PAGE_SIZE}
                                pagination
                                onSelect={(customer) => {
                                    if (customer) router.push(createLicenseCustomerPath(locale, customer.id))
                                }}
                                emptyComponent={
                                    <DataTableColumn colSpan={4}>
                                        <Text size="sm" hierarchy="tertiary">
                                            {content.dashboard.emptyCustomers}
                                        </Text>
                                    </DataTableColumn>
                                }
                            >
                                {customerTableHeader}
                                {(customer) => (
                                    <Fragment key={customer.id}>
                                        <DataTableColumn>
                                            <Text size="sm" fw={500}>
                                                {customer.name || customer.email || customer.id}
                                            </Text>
                                        </DataTableColumn>
                                        <DataTableColumn>
                                            <Text size="sm" hierarchy="tertiary">
                                                {formatLicenseDisplayValue(customer.customerType, "customerType", content.values)}
                                            </Text>
                                        </DataTableColumn>
                                        <DataTableColumn>
                                            <Text size="sm" hierarchy="tertiary">
                                                {customer.email || "—"}
                                            </Text>
                                        </DataTableColumn>
                                        <DataTableColumn>
                                            <Text size="sm" hierarchy="tertiary" className="tabular-nums">
                                                {customer.subscriptionCount}
                                            </Text>
                                        </DataTableColumn>
                                    </Fragment>
                                )}
                                {customers.length > LICENSE_DATA_TABLE_PAGE_SIZE ? <LicenseDataTablePagination labels={content.pagination} /> : null}
                            </DataTable>
                        )}
                    </AutoScrollArea>
                </Card>
                {pagination?.customers?.hasNextPage ? <LicenseLoadMoreButton loading={loadingMore === "customers"} labels={content.pagination} onClick={() => void loadMore("customers")} /> : null}
            </section>

            <Spacing spacing="xl" />

            <section aria-labelledby="recent-licenses-heading">
                <Text id="recent-licenses-heading" hierarchy="secondary" size="lg">
                    {content.dashboard.recentLicensesLabel}
                </Text>
                <Spacing spacing="xs" />
                <Text size="md" hierarchy="tertiary" maw="50%">
                    {content.dashboard.recentLicensesDescription}
                </Text>
                <Spacing spacing="md" />

                <Card color="secondary" className="pt-2!">
                    {isLoading ? (
                        <LicenseDataTableSkeleton header={recentLicenseTableHeader} widths={["w-12", "w-24", "w-14", "w-24", "w-20"]} />
                    ) : (
                        <DataTable
                            data={recentLicenses}
                            onSelect={(license) => {
                                if (license) router.push(createLicensePath(locale, license.customerId, license.id))
                            }}
                            emptyComponent={
                                <DataTableColumn colSpan={5}>
                                    <Text size="sm" hierarchy="tertiary">
                                        {content.emptyLicenses}
                                    </Text>
                                </DataTableColumn>
                            }
                        >
                            {recentLicenseTableHeader}
                            {(license) => (
                                <Fragment key={license.id}>
                                    <DataTableColumn>
                                        <Text size="sm" fw={500}>
                                            {formatLicenseDisplayValue(license.plan, "plan", content.values)}
                                        </Text>
                                    </DataTableColumn>
                                    <DataTableColumn>
                                        <Text size="sm" hierarchy="tertiary">
                                            {license.customerName || "—"}
                                        </Text>
                                    </DataTableColumn>
                                    <DataTableColumn>
                                        <Badge color={getLicenseStatusBadgeColor(license.status)}>{formatLicenseDisplayValue(license.status, "status", content.values)}</Badge>
                                    </DataTableColumn>
                                    <DataTableColumn>
                                        <Text size="sm" hierarchy="tertiary">
                                            {formatLicenseEdition(license.deploymentType, content.values.editions)}
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
                    )}
                </Card>
            </section>
        </div>
    )
}
