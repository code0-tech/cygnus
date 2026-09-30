"use client"

import { DataTableControls } from "@/components/licenses/DataTableControls"
import { getLicenseDetailGridCellClassName } from "@/components/licenses/licenseDetailGrid"
import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { LicenseLoadMoreButton } from "@/components/licenses/LicenseLoadMoreButton"
import { LICENSE_DATA_TABLE_PAGE_SIZE, LicenseDataTablePagination } from "@/components/licenses/LicenseDataTablePagination"
import { LicenseStatusBadge } from "@/components/licenses/LicenseStatusDot"
import type { LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { formatLicenseDisplayValue } from "@/lib/licenses/licenseDisplayValues"
import { createLicenseCustomerPath, createLicensePath, resolveCustomerRouteId } from "@/lib/licenses/licenseRoute"
import { AutoScrollArea, Button, Card, DataTable, DataTableColumn, DataTableHeader, DataTableHeaderColumn, Flex, Spacing, Text, type DataTableFilterProps } from "@code0-tech/pictor"
import { useRouter } from "next/navigation"
import { Fragment, useState } from "react"

function formatLicenseEdition(deploymentType?: string) {
    if (deploymentType === "cloud") return "Cloud Edition"
    if (deploymentType === "self_hosted") return "Enterprise Edition"
    return "—"
}

interface LicenseCustomerPageProps {
    content: LicenseContent
    customerId: string
    locale: AppLocale
}

export function LicenseCustomerPage({ content, customerId, locale }: LicenseCustomerPageProps) {
    const router = useRouter()
    const { customers, isLoading, licenses, loadMore, loadingMore, pagination } = useLicenseData()
    const resolvedCustomerId = resolveCustomerRouteId(customerId)
    const customer = customers.find((candidate) => candidate.id === resolvedCustomerId)
    const customerLicenses = licenses.filter((license) => license.customerId === resolvedCustomerId)
    const [statusFilters, setStatusFilters] = useState<string[]>([])
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
    const licenseRows = customerLicenses.map((license) => ({ ...license, tableStatus: license.status?.trim().toLowerCase().replaceAll("-", "_") }))
    const tableFilter: DataTableFilterProps | undefined = statusFilters.length ? { tableStatus: { operator: "isOneOf", value: statusFilters } } : undefined
    const dateFormatter = new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeZone: "UTC",
    })
    const customerDetails = customer
        ? [
              { label: content.dashboard.nameLabel, value: customer.name || "—" },
              { label: content.dashboard.emailLabel, value: customer.email || "—" },
              {
                  label: content.dashboard.customerLabel,
                  value: formatLicenseDisplayValue(customer.customerType, "customerType", content.values),
              },
              { label: content.licenses, value: String(customer.licenseCount) },
          ]
        : []

    return (
        <div>
            <section aria-label={content.dashboard.customerLabel}>
                <Flex justify="end">
                    {isLoading || customer ? (
                        <Button
                            type="button"
                            variant="normal"
                            paddingSize="xxs"
                            disabled={isLoading || !customer}
                            onClick={() => {
                                if (!customer) return
                                router.push(`${createLicenseCustomerPath(locale, customer.id)}/edit`)
                            }}
                            className="shrink-0 text-sm!"
                        >
                            {content.dashboard.editLabel}
                        </Button>
                    ) : null}
                </Flex>
                <Spacing spacing="md" />

                <Card color="secondary" className="overflow-hidden p-0!">
                    {customer ? (
                        <div className="grid sm:grid-cols-2 xl:grid-cols-4">
                            {customerDetails.map((detail, index) => (
                                <div
                                    key={detail.label}
                                    className={getLicenseDetailGridCellClassName(index)}
                                >
                                    <Text size="sm" hierarchy="tertiary" className="truncate">
                                        {detail.label}
                                    </Text>
                                    <Text fw={400} title={detail.value} className="mt-3! truncate text-xl! leading-tight! text-white!">
                                        {detail.value}
                                    </Text>
                                </div>
                            ))}
                        </div>
                    ) : isLoading ? (
                        <div aria-hidden="true" className="grid sm:grid-cols-2 xl:grid-cols-4">
                            {Array.from({ length: 4 }, (_, index) => (
                                <div
                                    key={index}
                                    className={getLicenseDetailGridCellClassName(index, "animate-pulse motion-reduce:animate-none")}
                                >
                                    <div className={index % 2 === 0 ? "h-3 w-16 rounded-full bg-white/10" : "h-3 w-20 rounded-full bg-white/10"} />
                                    <div className={index === 1 ? "mt-4 h-8 w-32 rounded-lg bg-white/10" : "mt-4 h-8 w-20 rounded-lg bg-white/10"} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Text size="sm" hierarchy="tertiary">
                            {content.dashboard.emptyCustomers}
                        </Text>
                    )}
                </Card>
            </section>

            <Spacing spacing="xl" />

            <section aria-labelledby="customer-licenses-heading">
                <Flex align="end" justify="space-between" style={{ gap: "1rem" }} className="flex-wrap">
                    <div className="min-w-0">
                        <Flex align="center" style={{ gap: "0.5rem" }}>
                            <Text id="customer-licenses-heading" hierarchy="secondary" size="xl">
                                {content.licenses}
                            </Text>
                            {isLoading ? (
                                <span aria-hidden="true" className="h-5 w-6 animate-pulse rounded-full bg-white/10 motion-reduce:animate-none" />
                            ) : (
                                <span className="inline-flex w-fit items-center rounded-full bg-[#191825] px-[0.35rem] py-[0.1167rem] text-[0.7rem] font-normal tracking-[-0.5px] text-white/75 shadow-[inset_0_1px_1px_rgba(191,191,191,0.1)]">
                                    {customer?.licenseCount ?? customerLicenses.length}
                                </span>
                            )}
                        </Flex>
                        <Text size="md" hierarchy="tertiary" className="mt-2!">
                            {content.licenseDescription}
                        </Text>
                    </div>
                    <DataTableControls
                        disabled={isLoading}
                        filterLabel={content.dashboard.statusLabel}
                        filterOptions={[
                            { value: "active", label: content.values.statuses.active },
                            { value: "pending", label: content.values.statuses.pending },
                            { value: "paid", label: content.values.statuses.paid },
                            { value: "payment_failed", label: content.values.statuses.paymentFailed },
                            { value: "canceled", label: content.values.statuses.canceled },
                            { value: "expired", label: content.values.statuses.expired },
                        ]}
                        selectedFilters={statusFilters}
                        onFilterChange={setStatusFilters}
                        sortDirection={sortDirection}
                        sortLabel={content.dashboard.lastEditedLabel}
                        onSortDirectionChange={setSortDirection}
                    />
                </Flex>
                <Spacing spacing="md" />

                <Card color="secondary" className="pt-2!">
                    <AutoScrollArea mah="28rem" type="scroll">
                        <DataTable
                            data={licenseRows}
                            filter={tableFilter}
                            limit={LICENSE_DATA_TABLE_PAGE_SIZE}
                            loading={isLoading}
                            pagination
                            sort={{ updatedAt: sortDirection }}
                            onSelect={(license) => {
                                if (license) router.push(createLicensePath(locale, resolvedCustomerId, license.id))
                            }}
                            emptyComponent={
                                <DataTableColumn colSpan={4}>
                                    <Text size="sm" hierarchy="tertiary">
                                        {content.emptyLicenses}
                                    </Text>
                                </DataTableColumn>
                            }
                        >
                            <DataTableHeader>
                                <DataTableHeaderColumn className="text-xs font-normal text-tertiary">{content.licenses}</DataTableHeaderColumn>
                                <DataTableHeaderColumn className="text-xs font-normal text-tertiary">{content.dashboard.statusLabel}</DataTableHeaderColumn>
                                <DataTableHeaderColumn className="text-xs font-normal text-tertiary">Edition</DataTableHeaderColumn>
                                <DataTableHeaderColumn className="text-xs font-normal text-tertiary">{content.dashboard.lastEditedLabel}</DataTableHeaderColumn>
                            </DataTableHeader>
                            {(license) => (
                                <Fragment key={license.id}>
                                    <DataTableColumn>
                                        <Flex align="center" style={{ gap: "0.6rem" }}>
                                            <Text size="sm" fw={500}>
                                                {formatLicenseDisplayValue(license.plan, "plan", content.values)}
                                            </Text>
                                        </Flex>
                                    </DataTableColumn>
                                    <DataTableColumn>
                                        <LicenseStatusBadge status={license.status}>{formatLicenseDisplayValue(license.status, "status", content.values)}</LicenseStatusBadge>
                                    </DataTableColumn>
                                    <DataTableColumn>
                                        <Text size="sm" hierarchy="tertiary">
                                            {formatLicenseEdition(license.deploymentType)}
                                        </Text>
                                    </DataTableColumn>
                                    <DataTableColumn>
                                        <Text size="sm" hierarchy="tertiary">
                                            {license.updatedAt ? dateFormatter.format(new Date(license.updatedAt)) : "—"}
                                        </Text>
                                    </DataTableColumn>
                                </Fragment>
                            )}
                            {licenseRows.length > LICENSE_DATA_TABLE_PAGE_SIZE ? <LicenseDataTablePagination locale={locale} /> : null}
                        </DataTable>
                    </AutoScrollArea>
                </Card>
                {pagination?.licenses?.hasNextPage ? <LicenseLoadMoreButton loading={loadingMore === "licenses"} labels={content.pagination} onClick={() => void loadMore("licenses")} /> : null}
            </section>
        </div>
    )
}
