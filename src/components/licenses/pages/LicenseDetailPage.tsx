"use client"

import { DataTableControls } from "@/components/licenses/DataTableControls"
import { InvoiceStatusDot } from "@/components/licenses/InvoiceStatusDot"
import { getLicenseDetailGridCellClassName } from "@/components/licenses/licenseDetailGrid"
import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { LicenseLoadMoreButton } from "@/components/licenses/LicenseLoadMoreButton"
import { LICENSE_DATA_TABLE_PAGE_SIZE, LicenseDataTablePagination } from "@/components/licenses/LicenseDataTablePagination"
import { LicenseStatusDot } from "@/components/licenses/LicenseStatusDot"
import { ButtonLoader } from "@/components/ui/Loader"
import type { LicenseContent, SubscriptionConfigData, UpgradeBannerData } from "@/lib/cms"
import { formatMinorCurrency } from "@/lib/formatters"
import type { AppLocale } from "@/lib/i18n"
import { downloadLicenseFile } from "@/lib/licenses/licenseClient"
import { formatLicenseDisplayValue } from "@/lib/licenses/licenseDisplayValues"
import { createLicensePath, resolveCustomerRouteId, resolveLicenseRouteId } from "@/lib/licenses/licenseRoute"
import type { LicenseDashboardInvoice } from "@/lib/licenses/licenseTypes"
import {
    Alert,
    Badge,
    Button,
    ButtonGroup,
    Card,
    DataTable,
    DataTableColumn,
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
    type DataTableFilterProps,
} from "@code0-tech/pictor"
import { IconDotsVertical, IconDownload, IconEye, IconX } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { Fragment, useState } from "react"

interface LicenseDetailPageProps {
    content: LicenseContent
    customerId: string
    licenseId: string
    locale: AppLocale
    namespaceHref: string
    subscriptionConfig?: SubscriptionConfigData | null
    upgradeBanner?: UpgradeBannerData | null
}

interface LicenseDetailItem {
    badge?: string
    label: string
    showStatusDot?: boolean
    value: string
}

export function LicenseDetailPage({ content, customerId, licenseId, locale, namespaceHref, subscriptionConfig, upgradeBanner }: LicenseDetailPageProps) {
    const router = useRouter()
    const { customers, isLoading, licenses, loadMore, loadingMore, pagination } = useLicenseData()
    const resolvedCustomerId = resolveCustomerRouteId(customerId)
    const resolvedLicenseId = resolveLicenseRouteId(licenseId)
    const license = licenses.find((candidate) => candidate.id === resolvedLicenseId && candidate.customerId === resolvedCustomerId)
    const customer = customers.find((candidate) => candidate.id === resolvedCustomerId)
    const [isDownloadingLicense, setIsDownloadingLicense] = useState(false)
    const [licenseDownloadError, setLicenseDownloadError] = useState(false)
    const dateFormatter = new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeZone: "UTC",
    })
    const formatInvoicePeriod = (start?: string, end?: string) => {
        if (!start && !end) return "—"
        return [start, end]
            .filter(Boolean)
            .map((value) => dateFormatter.format(new Date(value!)))
            .join(" – ")
    }
    const formatDate = (value?: string) => (value ? dateFormatter.format(new Date(value)) : "—")
    const billingDateLabel = locale === "de" ? "Rechnungsdatum" : "Billing date"
    const nextBillingDateLabel = locale === "de" ? "Nächste Abrechnung" : "Next billing date"
    // A canceled subscription, or one whose cancellation has been requested, is not billed again.
    const hasNextBilling = Boolean(license && !license.canceledAt && license.status?.trim().toLowerCase() !== "canceled")
    const showNamespaceWarning = license?.deploymentType === "cloud" && !license.namespaceId
    const licenseDetails: LicenseDetailItem[] = license
        ? [
              { label: content.dashboard.statusLabel, value: formatLicenseDisplayValue(license.status, "status", content.values), showStatusDot: true },
              {
                  badge: formatLicenseDisplayValue(license.deploymentType, "deploymentType", content.values),
                  label: content.license,
                  value: formatLicenseDisplayValue(license.plan, "plan", content.values),
              },
              { label: content.dashboard.paymentPeriodLabel, value: formatLicenseDisplayValue(license.paymentPeriod, "paymentPeriod", content.values) },
              { label: nextBillingDateLabel, value: hasNextBilling ? formatDate(license.currentPeriodEnd) : "—" },
          ]
        : []
    const invoices = license?.invoices ?? []
    const [invoiceStatusFilters, setInvoiceStatusFilters] = useState<string[]>([])
    const [invoiceSortDirection, setInvoiceSortDirection] = useState<"asc" | "desc">("desc")
    const [selectedInvoice, setSelectedInvoice] = useState<LicenseDashboardInvoice | null>(null)
    const invoiceRows = invoices.map((invoice) => ({ ...invoice, tableStatus: invoice.status?.trim().toLowerCase().replaceAll("-", "_") }))
    const invoiceFilter: DataTableFilterProps | undefined = invoiceStatusFilters.length ? { tableStatus: { operator: "isOneOf", value: invoiceStatusFilters } } : undefined

    const withdrawalDeadline = license?.startDate ? new Date(new Date(license.startDate).getTime() + 14 * 24 * 60 * 60 * 1000) : null
    const showWithdrawalNotice = (customer?.customerType ?? license?.customerType) === "personal" && withdrawalDeadline !== null && withdrawalDeadline.getTime() > Date.now()
    const [withdrawalTextBeforeDate, withdrawalTextAfterDate] = content.withdrawal.text.split("{date}")

    const downloadCurrentLicense = async () => {
        if (!license || license.deploymentType !== "self_hosted" || isDownloadingLicense) return

        setIsDownloadingLicense(true)
        setLicenseDownloadError(false)

        try {
            await downloadLicenseFile(license.id)
        } catch {
            setLicenseDownloadError(true)
        } finally {
            setIsDownloadingLicense(false)
        }
    }

    const editButton = (
        <Button
            type="button"
            variant="normal"
            paddingSize="xxs"
            disabled={isLoading || !license}
            onClick={() => {
                if (!license) return
                router.push(`${createLicensePath(locale, license.customerId, license.id)}/edit?tab=license`)
            }}
            className="shrink-0 text-sm!"
        >
            {content.dashboard.editLabel}
        </Button>
    )
    const selectedInvoiceNumber = selectedInvoice?.invoiceNumber || selectedInvoice?.id.split("/").at(-1) || selectedInvoice?.id
    const selectedInvoicePreviewUrl = selectedInvoice?.stripePdfUrl ? `/api/crater/invoices/preview?url=${encodeURIComponent(selectedInvoice.stripePdfUrl)}` : null
    const viewInvoiceLabel = locale === "de" ? "Ansehen" : "View"

    return (
        <div>
            <section aria-label={content.license}>
                <Flex justify="end">
                    {isLoading || license ? (
                        license?.deploymentType === "self_hosted" ? (
                            <ButtonGroup>
                                <Button type="button" variant="normal" paddingSize="xxs" disabled={isDownloadingLicense} onClick={() => void downloadCurrentLicense()} className="shrink-0 text-sm!">
                                    {isDownloadingLicense ? <ButtonLoader label={content.invoices.downloadLabel} /> : <IconDownload aria-hidden="true" size={16} />}
                                    {!isDownloadingLicense ? content.invoices.downloadLabel : null}
                                </Button>
                                {editButton}
                            </ButtonGroup>
                        ) : (
                            editButton
                        )
                    ) : null}
                </Flex>
                {licenseDownloadError ? (
                    <>
                        <Spacing spacing="xs" />
                        <Text role="alert" size="sm" hierarchy="tertiary" className="text-error!">
                            {content.invoices.unavailableLabel}
                        </Text>
                    </>
                ) : null}
                {showNamespaceWarning ? (
                    <>
                        <Spacing spacing="xs" />
                        <Alert color="warning" role="alert">
                            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <span>{content.editor.licenseDescription}</span>
                                <Button
                                    type="button"
                                    variant="none"
                                    paddingSize="xs"
                                    className="shrink-0 bg-white/80! text-primary! hover:bg-white! transition-colors! py-1! px-2! rounded-lg!"
                                    onClick={() => window.location.assign(namespaceHref)}
                                >
                                    {content.editor.changeNamespaceLabel}
                                </Button>
                            </div>
                        </Alert>
                    </>
                ) : null}
                <Spacing spacing="md" />
                <Card color="secondary" className="overflow-hidden p-0!">
                    {license ? (
                        <div>
                            <div className="grid sm:grid-cols-2 xl:grid-cols-4">
                                {licenseDetails.map((detail, index) => (
                                    <div
                                        key={detail.label}
                                        className={getLicenseDetailGridCellClassName(index)}
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <Text size="sm" hierarchy="tertiary" className="truncate">
                                                {detail.label}
                                            </Text>
                                            {detail.badge ? <Badge color="tertiary">{detail.badge}</Badge> : null}
                                        </div>
                                        <Flex align="center" style={{ gap: "0.5rem" }} className="mt-3 min-w-0">
                                            {detail.showStatusDot ? <LicenseStatusDot aria-hidden="true" status={license.status} /> : null}
                                            <Text fw={400} title={detail.value} className="truncate text-xl! leading-tight! text-white!">
                                                {detail.value}
                                            </Text>
                                        </Flex>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : isLoading ? (
                        <div aria-hidden="true">
                            <div className="grid sm:grid-cols-2 xl:grid-cols-4">
                                {Array.from({ length: 4 }, (_, index) => (
                                    <div
                                        key={index}
                                        className={getLicenseDetailGridCellClassName(index, "animate-pulse motion-reduce:animate-none")}
                                    >
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

                {showWithdrawalNotice && withdrawalDeadline && (
                    <>
                        <Spacing spacing="md" />
                        <Card color="secondary" className="text-sm text-secondary">
                            {withdrawalTextBeforeDate}
                            <span className="font-medium text-white">{dateFormatter.format(withdrawalDeadline)}</span>
                            {withdrawalTextAfterDate}
                        </Card>
                    </>
                )}
            </section>
            <Spacing spacing="xl" />

            <Spacing spacing="xl" />
            <section aria-labelledby="license-invoices-heading">
                <Flex align="end" justify="space-between" style={{ gap: "1rem" }} className="flex-wrap">
                    <div className="min-w-0">
                        <Text id="license-invoices-heading" hierarchy="secondary" size="xl">
                            {content.invoices.title}
                        </Text>
                        <Text size="md" hierarchy="tertiary" className="mt-2!">
                            {content.invoices.description}
                        </Text>
                    </div>
                    <DataTableControls
                        disabled={isLoading}
                        filterLabel={content.invoices.statusLabel}
                        filterOptions={[
                            { value: "draft", label: content.values.invoiceStatuses.draft },
                            { value: "open", label: content.values.invoiceStatuses.open },
                            { value: "paid", label: content.values.statuses.paid },
                            { value: "uncollectible", label: content.values.invoiceStatuses.uncollectible },
                            { value: "void", label: content.values.invoiceStatuses.void },
                        ]}
                        selectedFilters={invoiceStatusFilters}
                        onFilterChange={setInvoiceStatusFilters}
                        sortDirection={invoiceSortDirection}
                        sortLabel={billingDateLabel}
                        onSortDirectionChange={setInvoiceSortDirection}
                    />
                </Flex>
                <Spacing spacing="md" />

                <Card color="secondary" className="pt-2!">
                    <DataTable
                        data={invoiceRows}
                        filter={invoiceFilter}
                        limit={LICENSE_DATA_TABLE_PAGE_SIZE}
                        loading={isLoading}
                        pagination
                        sort={{ billingPeriodStart: invoiceSortDirection }}
                        emptyComponent={
                            <DataTableColumn colSpan={5}>
                                <Text size="sm" hierarchy="tertiary">
                                    {content.invoices.empty}
                                </Text>
                            </DataTableColumn>
                        }
                    >
                        <DataTableHeader>
                            <DataTableHeaderColumn className="font-normal text-tertiary text-xs">{content.invoices.numberLabel}</DataTableHeaderColumn>
                            <DataTableHeaderColumn className="font-normal text-tertiary text-xs">{billingDateLabel}</DataTableHeaderColumn>
                            <DataTableHeaderColumn className="font-normal text-tertiary text-xs">{content.invoices.amountLabel}</DataTableHeaderColumn>
                            <DataTableHeaderColumn className="font-normal text-tertiary text-xs">{content.invoices.statusLabel}</DataTableHeaderColumn>
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
                                        {formatDate(invoice.billingPeriodStart)}
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
                                    <Menu>
                                        <MenuTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="none"
                                                paddingSize="xxs"
                                                aria-label={`${content.invoices.title}: ${invoice.invoiceNumber || invoice.id.split("/").at(-1) || invoice.id}`}
                                            >
                                                <IconDotsVertical aria-hidden="true" size={16} />
                                            </Button>
                                        </MenuTrigger>
                                        <MenuPortal>
                                            <MenuContent align="end" sideOffset={8}>
                                                <MenuLabel>{content.invoices.title}</MenuLabel>
                                                <MenuItem onSelect={() => setSelectedInvoice(invoice)}>
                                                    <IconEye aria-hidden="true" size={15} />
                                                    {viewInvoiceLabel}
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
                        {invoiceRows.length > LICENSE_DATA_TABLE_PAGE_SIZE ? <LicenseDataTablePagination locale={locale} /> : null}
                    </DataTable>
                </Card>
                {pagination?.invoices?.hasNextPage ? <LicenseLoadMoreButton loading={loadingMore === "invoices"} labels={content.pagination} onClick={() => void loadMore("invoices")} /> : null}
            </section>

            <Dialog open={selectedInvoice !== null} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
                <DialogPortal>
                    <DialogOverlay className="backdrop-blur-sm" />
                    <DialogContent showCloseButton={false} className="h-[calc(100dvh-2rem)]! w-[calc(100vw-2rem)]! max-w-5xl! overflow-hidden! border border-white/5 bg-primary! p-4! sm:p-6!">
                        <DialogHeader className="pr-10 text-left!">
                            <DialogTitle className="font-normal! text-white!">
                                {content.invoices.title} {selectedInvoiceNumber ? `#${selectedInvoiceNumber}` : ""}
                            </DialogTitle>
                            {selectedInvoice ? (
                                <DialogDescription className="text-sm! text-secondary!">
                                    {formatInvoicePeriod(selectedInvoice.billingPeriodStart, selectedInvoice.billingPeriodEnd)} ·{" "}
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
                        <div className="mt-5 h-[calc(100%-4.5rem)] min-h-0 overflow-hidden rounded-xl border border-white/10 bg-white">
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
