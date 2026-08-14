"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { LicenseStatusDot } from "@/components/licenses/LicenseStatusDot"
import { LicensePlanIcon } from "@/components/licenses/LicensePlanIcon"
import {
    LicenseDataTable as DataTable,
    LicenseDataTableColumn as DataTableColumn,
    LicenseDataTableHeader as DataTableHeader,
    LicenseDataTableHeaderColumn as DataTableHeaderColumn,
} from "@/components/licenses/LicenseDataTable"
import type { LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { decodeLicenseRouteId } from "@/lib/licenses/licenseRoute"
import { formatLicenseDisplayValue } from "@/lib/licenses/licenseDisplayValues"
import { Button, Card, Flex, Spacing, Text } from "@code0-tech/pictor"
import { useRouter } from "next/navigation"
import { Fragment } from "react"

interface LicenseCustomerPageProps {
    content: LicenseContent
    customerId: string
    locale: AppLocale
}

export function LicenseCustomerPage({ content, customerId, locale }: LicenseCustomerPageProps) {
    const router = useRouter()
    const { customers, isLoading, licenses } = useLicenseData()
    const resolvedCustomerId = decodeLicenseRouteId(customerId)
    const customer = customers.find((candidate) => candidate.id === resolvedCustomerId)
    const customerLicenses = licenses.filter((license) => license.customerId === resolvedCustomerId)
    const dateFormatter = new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeZone: "UTC",
    })
    const customerDetails = customer
        ? [
              { label: content.editor.nameLabel, value: customer.name || "—" },
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
            <section aria-labelledby="customer-heading">
                <Flex align="center" justify="space-between" style={{ gap: "1rem" }}>
                    <div className="min-w-0">
                        <Text id="customer-heading" hierarchy="secondary" size="lg">
                            {content.dashboard.customerLabel}
                        </Text>
                    </div>
                    {isLoading || customer ? (
                        <Button
                            type="button"
                            variant="normal"
                            paddingSize="xs"
                            disabled={isLoading || !customer}
                            onClick={() => {
                                if (!customer) return
                                router.push(`/${locale}/licenses/customer/${encodeURIComponent(customer.id)}/edit`)
                            }}
                            className="shrink-0 text-sm!"
                        >
                            {content.dashboard.editLabel}
                        </Button>
                    ) : null}
                </Flex>
                <Spacing spacing="md" />

                <Card color="secondary">
                    {customer ? (
                        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                            {customerDetails.map((detail) => (
                                <div key={detail.label} className="min-w-0">
                                    <Text size="sm" hierarchy="tertiary">
                                        {detail.label}
                                    </Text>
                                    <Spacing spacing="xxs" />
                                    <Text size="sm" fw={500} className="`wrap-break-word">
                                        {detail.value}
                                    </Text>
                                </div>
                            ))}
                        </div>
                    ) : isLoading ? (
                        <div aria-hidden="true" className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                            {Array.from({ length: 4 }, (_, index) => (
                                <div key={index} className="min-w-0 animate-pulse motion-reduce:animate-none">
                                    <div className={index % 2 === 0 ? "h-3 w-16 rounded-full bg-white/10" : "h-3 w-20 rounded-full bg-white/10"} />
                                    <Spacing spacing="xxs" />
                                    <div className={index === 1 ? "h-4 w-32 rounded-full bg-white/10" : "h-4 w-20 rounded-full bg-white/10"} />
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
                <Flex align="center" style={{ gap: "0.5rem" }}>
                    <Text id="customer-licenses-heading" hierarchy="secondary" size="lg">
                        {content.licenses}
                    </Text>
                    {isLoading ? (
                        <span aria-hidden="true" className="h-5 w-6 animate-pulse rounded-full bg-white/10 motion-reduce:animate-none" />
                    ) : (
                        <span className="inline-flex w-fit items-center rounded-full bg-[#191825] px-[0.35rem] py-[0.1167rem] text-[0.7rem] font-normal tracking-[-0.5px] text-white/75 shadow-[inset_0_1px_1px_rgba(191,191,191,0.1)]">
                            {customerLicenses.length}
                        </span>
                    )}
                </Flex>
                <Spacing spacing="md" />

                <Card color="secondary" className="pt-2!">
                    <DataTable
                        data={customerLicenses}
                        loading={isLoading}
                        onRowClick={(license) => router.push(`/${locale}/licenses/customer/${encodeURIComponent(resolvedCustomerId)}/license/${encodeURIComponent(license.id)}`)}
                        rowKey={(license) => license.id}
                        emptyComponent={
                            <DataTableColumn colSpan={4}>
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
                        </DataTableHeader>
                        {(license) => (
                            <Fragment key={license.id}>
                                <DataTableColumn>
                                    <Flex align="center" style={{ gap: "0.6rem" }}>
                                        <LicensePlanIcon className="shrink-0 text-brand" plan={license.plan} size={16} />
                                        <Text size="sm" fw={500}>
                                            {formatLicenseDisplayValue(license.plan, "plan", content.values)}
                                        </Text>
                                    </Flex>
                                </DataTableColumn>
                                <DataTableColumn>
                                    <Flex align="center" style={{ gap: "0.5rem" }}>
                                        <LicenseStatusDot aria-hidden="true" status={license.status} />
                                        <Text size="sm" hierarchy="tertiary">
                                            {formatLicenseDisplayValue(license.status, "status", content.values)}
                                        </Text>
                                    </Flex>
                                </DataTableColumn>
                                <DataTableColumn>
                                    <Text size="sm" hierarchy="tertiary">
                                        {formatLicenseDisplayValue(license.deploymentType, "deploymentType", content.values)}
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
        </div>
    )
}
