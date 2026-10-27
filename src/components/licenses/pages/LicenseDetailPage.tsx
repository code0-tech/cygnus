"use client"

import { DataTableControls } from "@/components/licenses/table/DataTableControls"
import { getLicenseDetailGridCellClassName } from "@/components/licenses/shared/licenseDetailGrid"
import { useLicenseData } from "@/components/licenses/data/LicenseDataProvider"
import { LicenseLoadMoreButton } from "@/components/licenses/table/LicenseLoadMoreButton"
import { LicenseDataTableSkeleton } from "@/components/licenses/table/LicenseDataTableSkeleton"
import { LICENSE_DATA_TABLE_PAGE_SIZE, LicenseDataTablePagination } from "@/components/licenses/table/LicenseDataTablePagination"
import { LicenseAlert } from "@/components/licenses/shared/LicenseAlert"
import { LicenseStatusDot } from "@/components/licenses/shared/LicenseStatusDot"
import type { ErrorsContent, LicenseContent, SubscriptionConfigData } from "@/lib/cms"
import { formatMinorCurrency } from "@/lib/formatters"
import type { AppLocale } from "@/lib/i18n"
import { formatInvoiceNumber, formatLicenseDisplayValue } from "@/lib/licenses/displayValues"
import { formatPendingUpdateSelection, resolvePendingUpdateDate } from "@/lib/licenses/pendingUpdate"
import { resolveCustomerRouteId, resolveSubscriptionRouteId } from "@/lib/licenses/routes"
import type { LicenseDashboardInvoice } from "@/lib/licenses/types"
import {
    Badge,
    Button,
    Card,
    DataTable,
    DataTableColumn,
    type DataTableFilterProps,
    DataTableHeader,
    DataTableHeaderColumn,
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    Flex,
    Menu,
    MenuContent,
    MenuItem,
    MenuLabel,
    MenuPortal,
    MenuTrigger,
    Spacing,
    Text,
} from "@code0-tech/pictor"
import { IconDotsVertical, IconDownload, IconEye, IconX } from "@tabler/icons-react"
import { Fragment, useState } from "react"

interface LicenseDetailPageProps {
    content: LicenseContent
    errors: ErrorsContent
    customerId: string
    licenseId: string
    locale: AppLocale
    namespaceHref: string
    subscriptionConfig?: SubscriptionConfigData | null
}

interface LicenseDetailItem {
    badge?: string
    label: string
    note?: string
    showStatusDot?: boolean
    value: string
}

function getInvoiceStatusBadgeColor(status?: string) {
    switch (status?.toLowerCase()) {
        case "paid":
            return "info"
        case "uncollectible":
            return "error"
        case "draft":
        case "void":
            return "tertiary"
        default:
            return "warning"
    }
}

export function LicenseDetailPage({ content, errors, customerId, licenseId, locale, namespaceHref, subscriptionConfig }: LicenseDetailPageProps) {
    const { isLoading, licenses, loadMore, loadingMore, pagination } = useLicenseData()
    const resolvedCustomerId = resolveCustomerRouteId(customerId)
    const resolvedSubscriptionId = resolveSubscriptionRouteId(licenseId)
    const license = licenses.find((candidate) => candidate.id === resolvedSubscriptionId && candidate.customerId === resolvedCustomerId)
    const dateFormatter = new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeZone: "UTC",
    })
    const formatDate = (value?: string) => (value ? dateFormatter.format(new Date(value)) : "—")
    const hasNextBilling = Boolean(license && !license.cancelAt && !license.canceledAt && license.subscriptionStatus?.trim().toLowerCase() !== "canceled")
    const showNamespaceWarning = license?.deploymentType === "cloud" && !license.namespaceId
    const pendingSelection = formatPendingUpdateSelection(license?.pendingUpdate, content, locale, license)
    const pendingChangeDate = hasNextBilling && pendingSelection ? resolvePendingUpdateDate(license?.pendingUpdate, license?.currentPeriodEnd) : null
    const pendingChangeMessage =
        pendingSelection && pendingChangeDate
            ? content.billing.currentPeriodEndPendingDescription.replaceAll("{selection}", pendingSelection).replaceAll("{date}", dateFormatter.format(pendingChangeDate))
            : null
    const licenseDetails: LicenseDetailItem[] = license
        ? [
              {
                  label: content.dashboard.statusLabel,
                  value: formatLicenseDisplayValue(license.status, "status", content.values),
              },
              {
                  badge: formatLicenseDisplayValue(license.deploymentType, "deploymentType", content.values),
                  label: content.license,
                  value: formatLicenseDisplayValue(license.plan, "plan", content.values),
              },
              {
                  label: content.dashboard.paymentPeriodLabel,
                  value: formatLicenseDisplayValue(license.paymentPeriod, "paymentPeriod", content.values),
              },
              {
                  label: content.dashboard.nextBillingDateLabel,
                  value: hasNextBilling ? formatDate(license.currentPeriodEnd) : "—",
              },
          ]
        : []
    const invoices = license?.invoices ?? []
    const [invoiceStatusFilters, setInvoiceStatusFilters] = useState<string[]>([])
    const [invoiceSortDirection, setInvoiceSortDirection] = useState<"asc" | "desc">("desc")
    const [selectedInvoice, setSelectedInvoice] = useState<LicenseDashboardInvoice | null>(null)
    const invoiceRows = invoices.map((invoice) => ({
        ...invoice,
        tableStatus: invoice.status?.trim().toLowerCase().replaceAll("-", "_"),
    }))
    const invoiceFilter: DataTableFilterProps | undefined = invoiceStatusFilters.length
        ? {
              tableStatus: {
                  operator: "isOneOf",
                  value: invoiceStatusFilters,
              },
          }
        : undefined

    const selectedInvoiceNumber = selectedInvoice ? formatInvoiceNumber(selectedInvoice.invoiceNumber, content.invoices) : null
    const selectedInvoicePreviewUrl = selectedInvoice?.stripePdfUrl
        ? `/api/crater/invoices/preview?${new URLSearchParams({ customerId: resolvedCustomerId, subscriptionId: resolvedSubscriptionId, invoiceId: selectedInvoice.id })}`
        : null

    const invoiceTableHeader = (
        <DataTableHeader>
            <DataTableHeaderColumn className="font-normal text-tertiary text-xs">{content.invoices.numberLabel}</DataTableHeaderColumn>
            <DataTableHeaderColumn className="font-normal text-tertiary text-xs">{content.invoices.billingDateLabel}</DataTableHeaderColumn>
            <DataTableHeaderColumn className="font-normal text-tertiary text-xs">{content.invoices.amountLabel}</DataTableHeaderColumn>
            <DataTableHeaderColumn className="font-normal text-tertiary text-xs">{content.invoices.statusLabel}</DataTableHeaderColumn>
            <DataTableHeaderColumn />
        </DataTableHeader>
    )

    return (
        <div>
            <section aria-label={content.license}>
                <Card color="secondary" className="overflow-hidden p-0!">
                    {license ? (
                        <div>
                            <div className="grid sm:grid-cols-2 xl:grid-cols-4">
                                {licenseDetails.map((detail, index) => (
                                    <div key={detail.label} className={getLicenseDetailGridCellClassName(index)}>
                                        <div className="flex min-w-0 items-center gap-2">
                                            <Text size="sm" hierarchy="tertiary" className="truncate">
                                                {detail.label}
                                            </Text>
                                        </div>
                                        <Flex align="center" style={{ gap: "0.5rem" }} className="mt-3 min-w-0">
                                            {detail.showStatusDot ? <LicenseStatusDot aria-hidden="true" status={license.status} /> : null}
                                            <Text fw={400} title={detail.value} className="truncate text-xl! leading-tight! text-white!">
                                                {detail.value}
                                            </Text>
                                        </Flex>
                                        {detail.note ? (
                                            <Text size="sm" hierarchy="tertiary" display="block" title={detail.note} className="mt-1! truncate">
                                                {detail.note}
                                            </Text>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : isLoading ? (
                        <div aria-hidden="true">
                            <div className="grid sm:grid-cols-2 xl:grid-cols-4">
                                {Array.from({ length: 4 }, (_, index) => (
                                    <div key={index} className={getLicenseDetailGridCellClassName(index, "animate-pulse motion-reduce:animate-none")}>
                                        <div className={index % 2 === 0 ? "h-3 w-20 rounded-full bg-white/10" : "h-3 w-28 rounded-full bg-white/10"} />
                                        <div className={index % 2 === 0 ? "mt-4 h-8 w-24 rounded-lg bg-white/10" : "mt-4 h-8 w-32 rounded-lg bg-white/10"} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <Text size="sm" hierarchy="tertiary">
                            {content.emptyLicenses}
                        </Text>
                    )}
                </Card>

                {pendingChangeMessage ? (
                    <>
                        <Spacing spacing="md" />
                        <LicenseAlert color="info" description={pendingChangeMessage} />
                    </>
                ) : null}

                {showNamespaceWarning ? (
                    <>
                        <Spacing spacing="md" />
                        <LicenseAlert
                            description={content.editor.licenseDescription}
                            action={
                                <Button type="button" paddingSize="xxs" color="tertiary" onClick={() => window.location.assign(namespaceHref)}>
                                    {content.editor.changeNamespaceLabel}
                                </Button>
                            }
                        />
                    </>
                ) : null}
            </section>
            <Spacing spacing="xl" />
            <section aria-labelledby="license-invoices-heading">
                <Flex align="center" justify="space-between" style={{ gap: "0.5rem" }}>
                    <Text id="license-invoices-heading" hierarchy="secondary" size="lg">
                        {content.invoices.title}
                    </Text>
                    <DataTableControls
                        disabled={isLoading}
                        filterLabel={content.invoices.statusLabel}
                        filterOptions={[
                            { value: "draft", label: content.values.invoiceStatuses.draft },
                            { value: "open", label: content.values.invoiceStatuses.open },
                            { value: "paid", label: content.values.invoiceStatuses.paid },
                            { value: "uncollectible", label: content.values.invoiceStatuses.uncollectible },
                            { value: "void", label: content.values.invoiceStatuses.void },
                        ]}
                        selectedFilters={invoiceStatusFilters}
                        onFilterChange={setInvoiceStatusFilters}
                        sortDirection={invoiceSortDirection}
                        sortLabel={content.invoices.billingDateLabel}
                        onSortDirectionChange={setInvoiceSortDirection}
                    />
                </Flex>
                <Spacing spacing="xs" />
                <Text size="md" hierarchy="tertiary" maw="50%">
                    {content.invoices.description}
                </Text>
                <Spacing spacing="md" />

                <Card color="secondary" className="pt-2!">
                    {isLoading ? (
                        <LicenseDataTableSkeleton cellHeight="h-[29.5px]" header={invoiceTableHeader} widths={["w-20", "w-20", "w-14", "w-12", "w-4"]} />
                    ) : (
                        <DataTable
                            data={invoiceRows}
                            filter={invoiceFilter}
                            limit={LICENSE_DATA_TABLE_PAGE_SIZE}
                            pagination
                            sort={{ createdAt: invoiceSortDirection }}
                            onSelect={(invoice) => invoice && setSelectedInvoice(invoice)}
                            emptyComponent={
                                <DataTableColumn colSpan={5}>
                                    <Text size="sm" hierarchy="tertiary">
                                        {content.invoices.empty}
                                    </Text>
                                </DataTableColumn>
                            }
                        >
                            {invoiceTableHeader}
                            {(invoice) => (
                                <Fragment key={invoice.id}>
                                    <DataTableColumn>
                                        <Text size="sm" fw={500}>
                                            {formatInvoiceNumber(invoice.invoiceNumber, content.invoices)}
                                        </Text>
                                    </DataTableColumn>
                                    <DataTableColumn>
                                        <Text size="sm" hierarchy="tertiary">
                                            {formatDate(invoice.createdAt)}
                                        </Text>
                                    </DataTableColumn>
                                    <DataTableColumn>
                                        <Text size="sm" hierarchy="tertiary">
                                            {typeof invoice.total === "number" && invoice.currency ? formatMinorCurrency(invoice.total, invoice.currency, locale) : "—"}
                                        </Text>
                                    </DataTableColumn>
                                    <DataTableColumn>
                                        <Badge color={getInvoiceStatusBadgeColor(invoice.status)}>{formatLicenseDisplayValue(invoice.status, "invoiceStatus", content.values)}</Badge>
                                    </DataTableColumn>
                                    {/* The row itself opens the invoice preview, so the action menu must not bubble. */}
                                    <DataTableColumn onClick={(event) => event.stopPropagation()}>
                                        <Menu>
                                            <MenuTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="none"
                                                    paddingSize="xxs"
                                                    aria-label={`${content.invoices.title}: ${formatInvoiceNumber(invoice.invoiceNumber, content.invoices)}`}
                                                >
                                                    <IconDotsVertical aria-hidden="true" size={16} />
                                                </Button>
                                            </MenuTrigger>
                                            <MenuPortal>
                                                <MenuContent align="end" sideOffset={8}>
                                                    <MenuLabel>{content.invoices.title}</MenuLabel>
                                                    <MenuItem onSelect={() => setSelectedInvoice(invoice)}>
                                                        <IconEye aria-hidden="true" size={15} />
                                                        {content.invoices.viewLabel}
                                                    </MenuItem>
                                                    {invoice.stripePdfUrl ? (
                                                        <MenuItem asChild>
                                                            <a href={invoice.stripePdfUrl} target="_blank" rel="noopener noreferrer">
                                                                <IconDownload aria-hidden="true" size={15} />
                                                                {content.invoices.downloadLabel}
                                                            </a>
                                                        </MenuItem>
                                                    ) : (
                                                        <MenuItem disabled>
                                                            <IconDownload aria-hidden="true" size={15} />
                                                            {content.invoices.unavailableLabel}
                                                        </MenuItem>
                                                    )}
                                                </MenuContent>
                                            </MenuPortal>
                                        </Menu>
                                    </DataTableColumn>
                                </Fragment>
                            )}
                            {invoiceRows.length > LICENSE_DATA_TABLE_PAGE_SIZE ? <LicenseDataTablePagination labels={content.pagination} /> : null}
                        </DataTable>
                    )}
                </Card>
                {pagination?.invoices?.hasNextPage ? <LicenseLoadMoreButton loading={loadingMore === "invoices"} labels={content.pagination} onClick={() => void loadMore("invoices")} /> : null}
            </section>

            <Dialog open={selectedInvoice !== null} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
                <DialogPortal>
                    <DialogOverlay className="backdrop-blur-sm" />
                    <DialogContent
                        tabIndex={-1}
                        onOpenAutoFocus={(event) => event.preventDefault()}
                        showCloseButton={false}
                        className="flex! flex-col! h-[calc(100dvh-2rem)]! w-[calc(100vw-2rem)]! max-w-5xl! overflow-hidden! border border-white/5 bg-primary! p-4! sm:p-6!"
                    >
                        <DialogHeader className="shrink-0 pr-10 text-left!">
                            <DialogTitle className="font-normal! text-white!">
                                {content.invoices.title} {selectedInvoice?.invoiceNumber?.trim() ? `#${selectedInvoiceNumber}` : selectedInvoiceNumber ? `· ${selectedInvoiceNumber}` : ""}
                            </DialogTitle>
                            {selectedInvoice ? (
                                <DialogDescription className="text-sm! text-secondary!">
                                    {formatDate(selectedInvoice.createdAt)} ·{" "}
                                    {typeof selectedInvoice.total === "number" && selectedInvoice.currency
                                        ? formatMinorCurrency(selectedInvoice.total, selectedInvoice.currency, locale)
                                        : content.invoices.unavailableLabel}
                                    {selectedInvoice.status ? ` · ${formatLicenseDisplayValue(selectedInvoice.status, "invoiceStatus", content.values)}` : ""}
                                </DialogDescription>
                            ) : null}
                        </DialogHeader>
                        <div className="absolute right-4 top-4 z-10">
                            <DialogClose asChild>
                                <Button type="button" variant="none" paddingSize="xxs" aria-label={content.editor.closeLabel}>
                                    <IconX aria-hidden="true" size={16} />
                                </Button>
                            </DialogClose>
                        </div>
                        <div className="mt-5 flex-1 min-h-0 overflow-hidden rounded-xl border border-white/10 bg-white">
                            {selectedInvoicePreviewUrl ? (
                                <iframe src={selectedInvoicePreviewUrl} title={`${content.invoices.title} ${selectedInvoiceNumber ?? ""}`} className="h-full w-full border-0" />
                            ) : (
                                <div className="flex h-full items-center justify-center bg-primary p-6">
                                    <Text size="sm" hierarchy="tertiary">
                                        {content.invoices.unavailableLabel}
                                    </Text>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </DialogPortal>
            </Dialog>
        </div>
    )
}
