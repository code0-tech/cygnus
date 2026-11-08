"use client"

import type { CheckoutStripeTaxLine } from "@/lib/checkout/client"
import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"
import { formatCompactNumber, formatCurrency } from "@/lib/formatters"
import type { AppLocale } from "@/lib/i18n"
import { Card } from "@code0-tech/pictor"
import NumberFlow from "@number-flow/react"
import { getPaymentPeriodMonths } from "@/lib/subscription/calculator"
import type { PaymentPeriod, SubscriptionPlan } from "@/lib/subscription/types"
import type { ReactNode } from "react"

export interface CheckoutPricingOverviewData {
    aiTokens: number
    billingCountry?: string | null
    currency?: string
    lineItemAmount: number
    lineItemLabel: string
    periodEnd: Date
    periodStart: Date
    planDescription?: string | null
    planTitle: string
    subtotalPrice: number
    taxAmount: number
    taxAmountInclusive?: number
    taxLines?: CheckoutStripeTaxLine[]
    taxPercentage: number | null
    taxPercentageInclusive?: number | null
    totalPrice: number
    workflowExecutions: number
}

interface CheckoutConfirmedPricingOverviewData {
    aiTokens: number | null
    currency: string
    customerType: string | null
    deployment: string | null
    discountAmount: number
    paymentPeriod: PaymentPeriod | null
    plan: SubscriptionPlan
    subtotalPrice: number
    taxAmount: number
    totalPrice: number
    workflowExecutions: number | null
}

interface CheckoutPricingOverviewBaseProps {
    content: CheckoutData["summary"]
    locale: AppLocale
    subscriptionConfig: SubscriptionConfigData
}

type CheckoutPricingOverviewProps = CheckoutPricingOverviewBaseProps & ((CheckoutPricingOverviewData & { confirmedPricing?: undefined }) | { confirmedPricing: CheckoutConfirmedPricingOverviewData })

export function CheckoutPricingOverview(props: CheckoutPricingOverviewProps) {
    if (props.confirmedPricing) {
        return <CheckoutConfirmedPricingOverview confirmedPricing={props.confirmedPricing} content={props.content} locale={props.locale} subscriptionConfig={props.subscriptionConfig} />
    }

    return <CheckoutPreviewPricingOverview {...props} />
}

function SummaryRow({ label, value }: { label: ReactNode; value: ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 text-sm">
            <span className="min-w-0 text-secondary">{label}</span>
            <span className="shrink-0 tabular-nums text-white">{value}</span>
        </div>
    )
}

function formatCountryName(countryCode: string, locale: AppLocale) {
    try {
        return new Intl.DisplayNames([locale === "de" ? "de-DE" : "en-US"], { type: "region" }).of(countryCode.toUpperCase()) ?? countryCode
    } catch {
        return countryCode
    }
}

function CheckoutPreviewPricingOverview({
    aiTokens,
    billingCountry = null,
    content,
    currency = "EUR",
    lineItemAmount,
    lineItemLabel,
    locale,
    periodEnd,
    periodStart,
    planDescription,
    planTitle,
    subtotalPrice,
    taxAmount,
    taxAmountInclusive = 0,
    taxLines = [],
    taxPercentage,
    taxPercentageInclusive = null,
    totalPrice,
    workflowExecutions,
}: CheckoutPricingOverviewBaseProps & CheckoutPricingOverviewData) {
    const formatAmount = (amount: number) => formatCurrency(amount, currency, locale)
    const dateFormatter = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "short", year: "numeric" })
    const percentFormatter = new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", { style: "percent", maximumFractionDigits: 2 })
    const totalExcludingTax = Math.round((totalPrice - taxAmount - taxAmountInclusive) * 100) / 100
    const countryName = billingCountry ? formatCountryName(billingCountry, locale) : null
    const hasTax = taxAmount > 0 || taxAmountInclusive > 0
    const formatTaxRate = (percentage: number | null) =>
        percentage === null
            ? formatAmount(totalExcludingTax)
            : content.pricing.taxRateLabel.replaceAll("{rate}", percentFormatter.format(percentage / 100)).replaceAll("{amount}", formatAmount(totalExcludingTax))
    const usageTiles = [
        { label: content.pricing.baseLabel, value: aiTokens },
        { label: content.pricing.workflowExecutionsLabel, value: workflowExecutions },
    ].filter((tile) => tile.value > 0)

    return (
        <Card className="bg-light! p-4!">
            <p className="text-lg font-semibold text-white">{planTitle}</p>
            {planDescription && <p className="mt-1 text-sm text-secondary">{planDescription}</p>}

            {usageTiles.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                    {usageTiles.map((tile) => (
                        <div key={tile.label} className="min-w-0 rounded-xl bg-white/5 px-4 py-3">
                            <p className="truncate text-xs font-medium text-tertiary">{tile.label}</p>
                            <p className="mt-0.5 text-lg font-semibold tabular-nums text-white">{formatCompactNumber(tile.value)}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="-mx-4 mt-4 flex items-start justify-between gap-4 border-t border-white/5 px-4 pt-4 text-sm">
                <div className="min-w-0">
                    <p className="font-medium text-white">{lineItemLabel}</p>
                    <p className="mt-0.5 text-xs text-tertiary">
                        {dateFormatter.format(periodStart)} — {dateFormatter.format(periodEnd)}
                    </p>
                </div>
                <span className="shrink-0 tabular-nums text-white">{formatAmount(lineItemAmount)}</span>
            </div>

            <div className="-mx-4 mt-4 border-t border-white/5 px-4 pt-4">
                <div className="space-y-2">
                    <SummaryRow label={content.pricing.subtotalLabel} value={formatAmount(subtotalPrice)} />

                    <div id="checkout-applied-discount" className="empty:hidden" aria-live="polite" />

                    <SummaryRow label={content.pricing.totalExcludingTaxLabel} value={formatAmount(totalExcludingTax)} />

                    {taxLines.length > 0 ? (
                        taxLines.map((tax) => (
                            <SummaryRow
                                key={`${tax.displayName}-${tax.inclusive}-${tax.percentage}`}
                                label={
                                    <>
                                        {tax.displayName}
                                        {countryName && ` – ${countryName}`}
                                        <span className="text-tertiary"> ({formatTaxRate(tax.percentage)})</span>
                                    </>
                                }
                                value={formatAmount(tax.amount)}
                            />
                        ))
                    ) : (
                        <>
                            {taxAmountInclusive > 0 && (
                                <SummaryRow
                                    label={
                                        <>
                                            {content.pricing.taxInclusiveLabel}
                                            {taxPercentageInclusive !== null && <span className="text-tertiary"> ({formatTaxRate(taxPercentageInclusive * 100)})</span>}
                                        </>
                                    }
                                    value={formatAmount(taxAmountInclusive)}
                                />
                            )}
                            {(taxAmount > 0 || taxPercentage !== null) && (taxAmount > 0 || taxAmountInclusive === 0) && (
                                <SummaryRow
                                    label={
                                        <>
                                            {taxAmount === 0 ? content.pricing.taxLabel : content.pricing.taxExclusiveLabel}
                                            {countryName && ` – ${countryName}`}
                                            {taxPercentage !== null && <span className="text-tertiary"> ({formatTaxRate(taxPercentage * 100)})</span>}
                                        </>
                                    }
                                    value={formatAmount(taxAmount)}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="-mx-4 mt-4 flex items-baseline justify-between gap-4 border-t border-white/5 px-4 pt-4 text-sm">
                <span className="font-medium text-white">{content.pricing.totalDueTodayLabel}</span>

                <div className="flex items-baseline gap-2">
                    <NumberFlow
                        value={totalPrice}
                        className="text-lg font-semibold tabular-nums text-brand"
                        locales={locale === "de" ? "de-DE" : "en-US"}
                        format={{ style: "currency", currency: currency.toUpperCase(), minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                    />
                    {hasTax && <span className="text-sm text-tertiary">{content.pricing.totalIncludingTaxSuffix}</span>}
                </div>
            </div>
        </Card>
    )
}

function CheckoutConfirmedPricingOverview({ confirmedPricing, content, locale, subscriptionConfig }: CheckoutPricingOverviewBaseProps & { confirmedPricing: CheckoutConfirmedPricingOverviewData }) {
    const { currency, customerType, deployment, discountAmount, paymentPeriod, subtotalPrice, taxAmount, totalPrice } = confirmedPricing
    const formatAmount = (amount: number) => formatCurrency(amount, currency, locale)
    const dateFormatter = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "short", year: "numeric" })
    const plan = subscriptionConfig.plan[confirmedPricing.plan]
    const totalExcludingTax = Math.round((totalPrice - taxAmount) * 100) / 100
    const deploymentTitle = deployment === "cloud" ? subscriptionConfig.deployment.cloud.title : deployment === "self_hosted" ? subscriptionConfig.deployment.selfHosted.title : null
    const customerTypeTitle = customerType === "b2b" || customerType === "b2c" ? subscriptionConfig.customerType[customerType].title : null
    const lineItemDetails = [deploymentTitle, customerTypeTitle].filter(Boolean).join(", ")
    const lineItemLabel = lineItemDetails ? `${plan.title} (${lineItemDetails})` : plan.title
    const periodStart = new Date()
    const periodEnd = new Date(periodStart)
    if (paymentPeriod) periodEnd.setMonth(periodEnd.getMonth() + getPaymentPeriodMonths(paymentPeriod))
    const usageTiles = [
        { label: content.pricing.baseLabel, value: confirmedPricing.aiTokens ?? 0 },
        { label: content.pricing.workflowExecutionsLabel, value: confirmedPricing.workflowExecutions ?? 0 },
    ].filter((tile) => tile.value > 0)

    return (
        <Card className="bg-light! p-4!">
            <p className="text-lg font-semibold text-white">{plan.title}</p>
            {plan.description && <p className="mt-1 text-sm text-secondary">{plan.description}</p>}

            {usageTiles.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                    {usageTiles.map((tile) => (
                        <div key={tile.label} className="min-w-0 rounded-xl bg-white/5 px-4 py-3">
                            <p className="truncate text-xs font-medium text-tertiary">{tile.label}</p>
                            <p className="mt-0.5 text-lg font-semibold tabular-nums text-white">{formatCompactNumber(tile.value)}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="-mx-4 mt-4 flex items-start justify-between gap-4 border-t border-white/5 px-4 pt-4 text-sm">
                <div className="min-w-0">
                    <p className="font-medium text-white">{lineItemLabel}</p>
                    {paymentPeriod && (
                        <p className="mt-0.5 text-xs text-tertiary">
                            {dateFormatter.format(periodStart)} — {dateFormatter.format(periodEnd)}
                        </p>
                    )}
                </div>
                <span className="shrink-0 tabular-nums text-white">{formatAmount(subtotalPrice)}</span>
            </div>

            <div className="-mx-4 mt-4 space-y-2 border-t border-white/5 px-4 pt-4">
                <SummaryRow label={content.pricing.subtotalLabel} value={formatAmount(subtotalPrice)} />
                {discountAmount > 0 && <SummaryRow label={content.pricing.discountInputPlaceholder} value={`-${formatAmount(discountAmount)}`} />}
                <SummaryRow label={content.pricing.totalExcludingTaxLabel} value={formatAmount(totalExcludingTax)} />
                <SummaryRow label={content.pricing.taxLabel} value={formatAmount(taxAmount)} />
            </div>

            <div className="-mx-4 mt-4 flex items-baseline justify-between gap-4 border-t border-white/5 px-4 pt-4 text-sm">
                <span className="font-medium text-white">{content.pricing.totalLabel}</span>

                <div className="flex items-baseline gap-2">
                    <NumberFlow
                        value={totalPrice}
                        className="text-lg font-semibold tabular-nums text-brand"
                        locales={locale === "de" ? "de-DE" : "en-US"}
                        format={{ style: "currency", currency: currency.toUpperCase(), minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                    />
                    {taxAmount > 0 && <span className="text-sm text-tertiary">{content.pricing.totalIncludingTaxSuffix}</span>}
                </div>
            </div>
        </Card>
    )
}
