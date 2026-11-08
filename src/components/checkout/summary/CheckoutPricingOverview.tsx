"use client"

import { StableBadge } from "@/components/ui/StableBadge"
import { getIcon } from "@/components/ui/IconRenderer"
import type { CheckoutStripeTaxLine } from "@/lib/checkout/client"
import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"
import { formatCompactNumber, formatCurrency } from "@/lib/formatters"
import type { AppLocale } from "@/lib/i18n"
import { Card } from "@code0-tech/pictor"
import NumberFlow from "@number-flow/react"
import type { IconColor } from "@/lib/cms"
import { TONE_CLASS_NAME } from "@/lib/subscription/tones"
import type { SubscriptionPlan } from "@/lib/subscription/types"
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
    periodSuffix: string
    plan: SubscriptionPlan
    taxAmount: number
    totalPrice: number
    workflowExecutions: number | null
}

interface CheckoutPricingOverviewBaseProps {
    content: CheckoutData["summary"]
    locale: AppLocale
    subscriptionConfig: SubscriptionConfigData
}

function SummaryBadge({ icon, value, tone = "neutral" }: { icon?: ReactNode; value: ReactNode; tone?: IconColor }) {
    return (
        <StableBadge color={tone} border className={`min-w-0! max-w-full! rounded-xl! gap-1.5! ${icon ? "pl-1.5!" : "pl-2.5!"} pr-2.5! py-0.5! text-sm! ${TONE_CLASS_NAME[tone]}`}>
            {icon && <span className="inline-flex shrink-0 text-current">{icon}</span>}
            <span className="min-w-0 truncate font-medium">{value}</span>
        </StableBadge>
    )
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
    const { currency, customerType, deployment, discountAmount, periodSuffix, taxAmount, totalPrice } = confirmedPricing
    const aiTokens = confirmedPricing.aiTokens ?? 0
    const workflowExecutions = confirmedPricing.workflowExecutions ?? 0
    const isCustomPlan = confirmedPricing.aiTokens !== null || confirmedPricing.workflowExecutions !== null
    const plan = subscriptionConfig.plan[confirmedPricing.plan]

    return (
        <Card className="bg-light! p-4!">
            <span className="flex flex-wrap items-center gap-2 text-sm text-secondary">
                <SummaryBadge tone={plan.color} value={plan.title} />
                {deployment && (
                    <SummaryBadge
                        icon={getIcon(deployment === "cloud" ? content.deploymentIcons.cloud : content.deploymentIcons.selfHosted, 16)}
                        tone={content.deploymentIconColor}
                        value={<span className="capitalize">{deployment.replaceAll("_", " ").replaceAll("-", " ")}</span>}
                    />
                )}
                {customerType && (
                    <SummaryBadge
                        icon={getIcon(customerType === "b2c" ? content.customerTypeIcons.b2c : content.customerTypeIcons.b2b, 16)}
                        tone={content.customerTypeIconColor}
                        value={<span className="uppercase">{customerType}</span>}
                    />
                )}
            </span>

            <div className="mt-4 space-y-2">
                {isCustomPlan && (
                    <>
                        <SummaryRow label={content.pricing.baseLabel} value={formatCompactNumber(aiTokens)} />
                        <SummaryRow label={content.pricing.workflowExecutionsLabel} value={formatCompactNumber(workflowExecutions)} />
                    </>
                )}

                {discountAmount > 0 && <SummaryRow label={content.pricing.discountInputPlaceholder} value={`-${formatCurrency(discountAmount, currency, locale)}`} />}

                <div id="checkout-applied-discount" className="empty:hidden" aria-live="polite" />

                <SummaryRow label={content.pricing.taxLabel} value={formatCurrency(taxAmount, currency, locale)} />
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
                    <span className="text-sm text-tertiary">{periodSuffix}</span>
                </div>
            </div>
        </Card>
    )
}
