"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { LicenseLoadMoreButton } from "@/components/licenses/LicenseLoadMoreButton"
import { LicensePlanIcon } from "@/components/licenses/LicensePlanIcon"
import { LicenseStatusDot } from "@/components/licenses/LicenseStatusDot"
import type { LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { formatLicenseDisplayValue } from "@/lib/licenses/licenseDisplayValues"
import { decodeLicenseRouteId } from "@/lib/licenses/licenseRoute"
import { cn } from "@/lib/utils"
import { AutoScrollArea, Button, Card, DataTable, DataTableColumn, DataTableHeader, DataTableHeaderColumn, Flex, Spacing, Text } from "@code0-tech/pictor"
import { useRouter } from "next/navigation"
import { Fragment } from "react"

interface LicenseCustomerPageProps {
    content: LicenseContent
    customerId: string
    locale: AppLocale
}

export function LicenseCustomerPage({ content, customerId, locale }: LicenseCustomerPageProps) {
    const router = useRouter()
    const { customers, isLoading, licenses, loadMore, loadingMore, pagination } = useLicenseData()
    const resolvedCustomerId = decodeLicenseRouteId(customerId)
    const customer = customers.find((candidate) => candidate.id === resolvedCustomerId)
    const customerLicenses = licenses.filter((license) => license.customerId === resolvedCustomerId)
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
            <section aria-labelledby="customer-heading">
                <Flex align="start" justify="space-between" style={{ gap: "1rem" }}>
                    <div className="min-w-0">
                        <Text id="customer-heading" hierarchy="secondary" size="xl">
                            {content.dashboard.customerLabel}
                        </Text>
                        <Text size="md" hierarchy="tertiary" className="mt-2!">
                            {content.editor.customerDescription}
                        </Text>
                    </div>
                    {isLoading || customer ? (
                        <Button
                            type="button"
                            variant="normal"
                            paddingSize="xxs"
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

                <Card color="secondary" className="overflow-hidden p-0!">
                    {customer ? (
                        <div className="grid sm:grid-cols-2 xl:grid-cols-4">
                            {customerDetails.map((detail, index) => (
                                <div
                                    key={detail.label}
                                    className={cn(
                                        "min-w-0 px-6 py-5",
                                        index > 0 && "border-t border-white/10",
                                        index === 1 && "sm:border-l sm:border-t-0",
                                        index === 3 && "sm:border-l",
                                        index > 0 && "xl:border-l xl:border-t-0"
                                    )}
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
                                    className={cn(
                                        "min-w-0 animate-pulse px-6 py-5 motion-reduce:animate-none",
                                        index > 0 && "border-t border-white/10",
                                        index === 1 && "sm:border-l sm:border-t-0",
                                        index === 3 && "sm:border-l",
                                        index > 0 && "xl:border-l xl:border-t-0"
                                    )}
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
                <Spacing spacing="md" />

                <Card color="secondary" className="pt-2!">
                    <AutoScrollArea mah="28rem" type="scroll">
                        <DataTable
                            data={customerLicenses}
                            loading={isLoading}
                            onSelect={(license) => {
                                if (license) router.push(`/${locale}/licenses/customer/${encodeURIComponent(resolvedCustomerId)}/license/${encodeURIComponent(license.id)}`)
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
                                <DataTableHeaderColumn className="text-xs font-normal text-tertiary">{content.dashboard.deploymentLabel}</DataTableHeaderColumn>
                                <DataTableHeaderColumn className="text-xs font-normal text-tertiary">{content.dashboard.lastEditedLabel}</DataTableHeaderColumn>
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
                    </AutoScrollArea>
                </Card>
                {pagination?.licenses?.hasNextPage ? <LicenseLoadMoreButton loading={loadingMore === "licenses"} labels={content.pagination} onClick={() => void loadMore("licenses")} /> : null}
            </section>
        </div>
    )
}
