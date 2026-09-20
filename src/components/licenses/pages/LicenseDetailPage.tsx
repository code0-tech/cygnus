"use client"

import { UpgradePlanBanner } from "@/components/checkout/UpgradePlanBanner"
import { InvoiceStatusDot } from "@/components/licenses/InvoiceStatusDot"
import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { LicenseLoadMoreButton } from "@/components/licenses/LicenseLoadMoreButton"
import { LicensePlanIcon } from "@/components/licenses/LicensePlanIcon"
import { LicenseStatusDot } from "@/components/licenses/LicenseStatusDot"
import { ButtonLoader } from "@/components/ui/Loader"
import type { LicenseContent, SubscriptionConfigData, UpgradeBannerData } from "@/lib/cms"
import { formatMinorCurrency } from "@/lib/formatters"
import type { AppLocale } from "@/lib/i18n"
import { downloadLicenseFile } from "@/lib/licenses/licenseClient"
import { formatLicenseDisplayValue } from "@/lib/licenses/licenseDisplayValues"
import { decodeLicenseRouteId } from "@/lib/licenses/licenseRoute"
import { cn } from "@/lib/utils"
import { Alert, Badge, Button, Card, DataTable, DataTableColumn, DataTableHeader, DataTableHeaderColumn, Flex, Spacing, Text } from "@code0-tech/pictor"
import { IconDownload } from "@tabler/icons-react"
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
    showPlanIcon?: boolean
    showStatusDot?: boolean
    value: string
}

export function LicenseDetailPage({ content, customerId, licenseId, locale, namespaceHref, subscriptionConfig, upgradeBanner }: LicenseDetailPageProps) {
    const router = useRouter()
    const { customers, isLoading, licenses, loadMore, loadingMore, pagination } = useLicenseData()
    const resolvedCustomerId = decodeLicenseRouteId(customerId)
    const resolvedLicenseId = decodeLicenseRouteId(licenseId)
    const license = licenses.find((candidate) => candidate.id === resolvedLicenseId && candidate.customerId === resolvedCustomerId)
    const customer = customers.find((candidate) => candidate.id === resolvedCustomerId)
    const [isDownloadingLicense, setIsDownloadingLicense] = useState(false)
    const [licenseDownloadError, setLicenseDownloadError] = useState(false)
    const dateFormatter = new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeZone: "UTC",
    })
    const showNamespaceWarning = license?.deploymentType === "cloud" && !license.namespaceId
    const licenseDetails: LicenseDetailItem[] = license
        ? [
              { label: content.dashboard.statusLabel, value: formatLicenseDisplayValue(license.status, "status", content.values), showStatusDot: true },
              {
                  badge: formatLicenseDisplayValue(customer?.customerType ?? license.customerType, "customerType", content.values),
                  label: content.dashboard.customerLabel,
                  value: customer?.name?.trim() || customer?.email?.trim() || customer?.id || license.customerName || license.customerId,
              },
              {
                  badge: formatLicenseDisplayValue(license.deploymentType, "deploymentType", content.values),
                  label: content.license,
                  showPlanIcon: true,
                  value: formatLicenseDisplayValue(license.plan, "plan", content.values),
              },
              { label: content.dashboard.paymentPeriodLabel, value: formatLicenseDisplayValue(license.paymentPeriod, "paymentPeriod", content.values) },
          ]
        : []
    const invoices = license?.invoices ?? []

    const withdrawalDeadline = license?.startDate ? new Date(new Date(license.startDate).getTime() + 14 * 24 * 60 * 60 * 1000) : null
    const showWithdrawalNotice = (customer?.customerType ?? license?.customerType) === "personal" && withdrawalDeadline !== null && withdrawalDeadline.getTime() > Date.now()
    const [withdrawalTextBeforeDate, withdrawalTextAfterDate] = content.withdrawal.text.split("{date}")

    const formatInvoicePeriod = (start?: string, end?: string) => {
        if (!start && !end) return "—"
        return [start, end]
            .filter(Boolean)
            .map((value) => dateFormatter.format(new Date(value!)))
            .join(" – ")
    }

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

    return (
        <div>
            <section aria-labelledby="license-heading">
                <Flex align="start" justify="space-between" style={{ gap: "1rem" }}>
                    <div className="min-w-0">
                        <Text id="license-heading" hierarchy="secondary" size="xl">
                            {content.license}
                        </Text>
                        <Text size="md" hierarchy="tertiary" className="mt-2!">
                            {content.licenseDescription}
                        </Text>
                    </div>
                    {isLoading || license ? (
                        <Flex align="center" style={{ gap: "0.5rem" }} className="flex-wrap justify-end">
                            {license?.deploymentType === "self_hosted" ? (
                                <Button type="button" variant="normal" paddingSize="xxs" disabled={isDownloadingLicense} onClick={() => void downloadCurrentLicense()} className="shrink-0 text-sm!">
                                    {isDownloadingLicense ? <ButtonLoader label={content.invoices.downloadLabel} /> : <IconDownload aria-hidden="true" size={16} />}
                                    {!isDownloadingLicense ? content.invoices.downloadLabel : null}
                                </Button>
                            ) : null}
                            <Button
                                type="button"
                                variant="normal"
                                paddingSize="xxs"
                                disabled={isLoading || !license}
                                onClick={() => {
                                    if (!license) return
                                    router.push(`/${locale}/licenses/customer/${encodeURIComponent(license.customerId)}/license/${encodeURIComponent(license.id)}/edit?tab=license`)
                                }}
                                className="shrink-0 text-sm!"
                            >
                                {content.dashboard.editLabel}
                            </Button>
                        </Flex>
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
                        <div className="grid sm:grid-cols-2 xl:grid-cols-4">
                            {licenseDetails.map((detail, index) => (
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
                                    <div className="flex min-w-0 items-center gap-2">
                                        <Text size="sm" hierarchy="tertiary" className="truncate">
                                            {detail.label}
                                        </Text>
                                        {detail.badge ? <Badge color="tertiary">{detail.badge}</Badge> : null}
                                    </div>
                                    <Flex align="center" style={{ gap: "0.5rem" }} className="mt-3 min-w-0">
                                        {detail.showStatusDot ? <LicenseStatusDot aria-hidden="true" status={license.status} /> : null}
                                        {detail.showPlanIcon ? <LicensePlanIcon className="shrink-0 text-brand" plan={license.plan} size={22} /> : null}
                                        <Text fw={400} title={detail.value} className="truncate text-xl! leading-tight! text-white!">
                                            {detail.value}
                                        </Text>
                                    </Flex>
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
                                    <div className={index % 2 === 0 ? "h-3 w-20 rounded-full bg-white/10" : "h-3 w-28 rounded-full bg-white/10"} />
                                    <div className={index % 2 === 0 ? "mt-4 h-8 w-24 rounded-lg bg-white/10" : "mt-4 h-8 w-32 rounded-lg bg-white/10"} />
                                </div>
                            ))}
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

            {license?.subscriptionId && (
                <UpgradePlanBanner
                    content={upgradeBanner}
                    currentPlan={license.plan}
                    onUpgrade={() => router.push(`/${locale}/licenses/customer/${encodeURIComponent(license.customerId)}/license/${encodeURIComponent(license.id)}/upgrade`)}
                    showPlanSpecificActions
                    subscriptionConfig={subscriptionConfig}
                />
            )}

            <Spacing spacing="xl" />
            <section aria-labelledby="license-invoices-heading">
                <Flex align="start" justify="space-between" style={{ gap: "1rem" }}>
                    <div className="min-w-0">
                        <Text id="license-invoices-heading" hierarchy="secondary" size="xl">
                            {content.invoices.title}
                        </Text>
                        <Text size="md" hierarchy="tertiary" className="mt-2!">
                            {content.invoices.description}
                        </Text>
                    </div>
                </Flex>
                <Spacing spacing="md" />

                <Card color="secondary" className="pt-2!">
                    <DataTable
                        data={invoices}
                        loading={isLoading}
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
                            <DataTableHeaderColumn className="font-normal text-tertiary text-xs">{content.invoices.periodLabel}</DataTableHeaderColumn>
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
