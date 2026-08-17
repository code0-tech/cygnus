"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { LicensePlanIcon } from "@/components/licenses/LicensePlanIcon"
import { LicenseStatusDot } from "@/components/licenses/LicenseStatusDot"
import { InvoiceStatusDot } from "@/components/licenses/InvoiceStatusDot"
import {
    LicenseDataTable as DataTable,
    LicenseDataTableColumn as DataTableColumn,
    LicenseDataTableHeader as DataTableHeader,
    LicenseDataTableHeaderColumn as DataTableHeaderColumn,
} from "@/components/licenses/LicenseDataTable"
import type { LicenseContent } from "@/lib/cms"
import { formatCompactNumber, formatMinorCurrency } from "@/lib/formatters"
import type { AppLocale } from "@/lib/i18n"
import { decodeLicenseRouteId, getNamespaceDisplayId } from "@/lib/licenses/licenseRoute"
import { formatLicenseDisplayValue } from "@/lib/licenses/licenseDisplayValues"
import { Button, Card, Flex, Spacing, Text } from "@code0-tech/pictor"
import { useRouter } from "next/navigation"
import { Fragment } from "react"
import { LicenseLoadMoreButton } from "@/components/licenses/LicenseLoadMoreButton"

interface LicenseDetailPageProps {
    content: LicenseContent
    customerId: string
    licenseId: string
    locale: AppLocale
}

export function LicenseDetailPage({ content, customerId, licenseId, locale }: LicenseDetailPageProps) {
    const router = useRouter()
    const { customers, isLoading, licenses, loadMore, loadingMore, pagination } = useLicenseData()
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
              { label: content.dashboard.statusLabel, value: formatLicenseDisplayValue(license.status, "status", content.values), showStatusDot: true },
              {
                  label: content.dashboard.typeLabel,
                  value: formatLicenseDisplayValue(customer?.customerType ?? license.customerType, "customerType", content.values),
              },
              { label: content.dashboard.deploymentLabel, value: formatLicenseDisplayValue(license.deploymentType, "deploymentType", content.values) },
              { label: content.licenses, value: formatLicenseDisplayValue(license.plan, "plan", content.values), showPlanIcon: true },
              { label: content.dashboard.paymentPeriodLabel, value: formatLicenseDisplayValue(license.paymentPeriod, "paymentPeriod", content.values) },
              ...(license.pendingUpdate
                  ? [
                        {
                            label: content.billing.pendingChangeLabel,
                            value: [
                                license.pendingUpdate.plan ? formatLicenseDisplayValue(license.pendingUpdate.plan, "plan", content.values) : null,
                                license.pendingUpdate.paymentPeriod ? formatLicenseDisplayValue(license.pendingUpdate.paymentPeriod, "paymentPeriod", content.values) : null,
                                license.pendingUpdate.effectiveAt ? dateFormatter.format(new Date(license.pendingUpdate.effectiveAt)) : null,
                            ]
                                .filter(Boolean)
                                .join(" · "),
                        },
                    ]
                  : []),
              ...(license.plan?.toLowerCase() === "custom"
                  ? [
                        { label: content.dashboard.workflowExecutionsLabel, value: license.workflowExecutions === undefined ? "—" : formatCompactNumber(license.workflowExecutions) },
                        { label: content.dashboard.aiTokensLabel, value: license.aiTokens === undefined ? "—" : formatCompactNumber(license.aiTokens) },
                    ]
                  : []),
              { label: content.editor.namespaceLabel, value: getNamespaceDisplayId(license.namespaceId) || "—" },
              {
                  label: content.dashboard.lastEditedLabel,
                  value: license.updatedAt ? dateFormatter.format(new Date(license.updatedAt)) : "—",
              },
          ]
        : []
    const invoices = license?.invoices ?? []

    const formatInvoicePeriod = (start?: string, end?: string) => {
        if (!start && !end) return "—"
        return [start, end]
            .filter(Boolean)
            .map((value) => dateFormatter.format(new Date(value!)))
            .join(" – ")
    }

    return (
        <div>
            <section aria-labelledby="license-heading">
                <Flex align="center" justify="space-between" style={{ gap: "1rem" }}>
                    <Text id="license-heading" hierarchy="secondary" size="lg">
                        {content.license}
                    </Text>
                    {isLoading || license ? (
                        <Flex align="center" style={{ gap: "0.5rem" }} className="flex-wrap justify-end">
                            {license?.subscriptionId && (
                                <>
                                    <Button
                                        type="button"
                                        variant="normal"
                                        paddingSize="xs"
                                        onClick={() => router.push(`/${locale}/licenses/customer/${encodeURIComponent(license.customerId)}/license/${encodeURIComponent(license.id)}/billing`)}
                                        className="shrink-0 text-sm!"
                                    >
                                        {content.billing.title}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="normal"
                                        paddingSize="xs"
                                        onClick={() => router.push(`/${locale}/licenses/customer/${encodeURIComponent(license.customerId)}/license/${encodeURIComponent(license.id)}/cancel`)}
                                        className="shrink-0 text-sm!"
                                    >
                                        {content.cancel.confirmLabel}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="filled"
                                        paddingSize="xs"
                                        className="shrink-0 text-sm! bg-white/80! hover:bg-white! text-primary!"
                                        onClick={() => router.push(`/${locale}/licenses/customer/${encodeURIComponent(license.customerId)}/license/${encodeURIComponent(license.id)}/upgrade`)}
                                    >
                                        {content.upgrade.title}
                                    </Button>
                                </>
                            )}
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
                        </Flex>
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
                                        <Text size="sm" fw={500} className="wrap-break-word">
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

            <Spacing spacing="xl" />

            <section aria-labelledby="license-invoices-heading">
                <Text id="license-invoices-heading" hierarchy="secondary" size="lg">
                    {content.invoices.title}
                </Text>
                <Spacing spacing="md" />

                <Card color="secondary" className="pt-2!">
                    <DataTable
                        data={invoices}
                        loading={isLoading}
                        rowKey={(invoice) => invoice.id}
                        emptyComponent={
                            <DataTableColumn colSpan={5}>
                                <Text size="sm" hierarchy="tertiary">
                                    {content.invoices.empty}
                                </Text>
                            </DataTableColumn>
                        }
                    >
                        <DataTableHeader>
                            <DataTableHeaderColumn>{content.invoices.numberLabel}</DataTableHeaderColumn>
                            <DataTableHeaderColumn>{content.invoices.periodLabel}</DataTableHeaderColumn>
                            <DataTableHeaderColumn>{content.invoices.amountLabel}</DataTableHeaderColumn>
                            <DataTableHeaderColumn>{content.invoices.statusLabel}</DataTableHeaderColumn>
                            <DataTableHeaderColumn />
                        </DataTableHeader>
                        {(invoice) => (
                            <Fragment key={invoice.id}>
                                <DataTableColumn>
                                    <Text size="sm" fw={500}>
                                        {invoice.invoiceNumber || invoice.id.split("/").at(-1) || invoice.id}
                                    </Text>
                                </DataTableColumn>
                                <DataTableColumn>
                                    <Text size="sm" hierarchy="tertiary">
                                        {formatInvoicePeriod(invoice.billingPeriodStart, invoice.billingPeriodEnd)}
                                    </Text>
                                </DataTableColumn>
                                <DataTableColumn>
                                    <Text size="sm" hierarchy="tertiary">
                                        {typeof invoice.total === "number" && invoice.currency ? formatMinorCurrency(invoice.total, invoice.currency, locale) : "—"}
                                    </Text>
                                </DataTableColumn>
                                <DataTableColumn>
                                    <Flex align="center" style={{ gap: "0.5rem" }}>
                                        <InvoiceStatusDot aria-hidden="true" status={invoice.status} />
                                        <Text size="sm" hierarchy="tertiary">
                                            {formatLicenseDisplayValue(invoice.status, "invoiceStatus", content.values)}
                                        </Text>
                                    </Flex>
                                </DataTableColumn>
                                <DataTableColumn>
                                    {invoice.stripePdfUrl ? (
                                        <a
                                            href={invoice.stripePdfUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex rounded-lg px-2 py-1 text-sm text-secondary transition-colors hover:bg-white/7 hover:text-white focus-visible:outline-2 focus-visible:outline-brand"
                                        >
                                            {content.invoices.downloadLabel}
                                        </a>
                                    ) : (
                                        <Text size="sm" hierarchy="tertiary">
                                            {content.invoices.unavailableLabel}
                                        </Text>
                                    )}
                                </DataTableColumn>
                            </Fragment>
                        )}
                    </DataTable>
                </Card>
                {pagination?.invoices?.hasNextPage ? <LicenseLoadMoreButton loading={loadingMore === "invoices"} labels={content.pagination} onClick={() => void loadMore("invoices")} /> : null}
            </section>
        </div>
    )
}
