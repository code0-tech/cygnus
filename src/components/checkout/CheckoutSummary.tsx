"use client"

import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"
import { formatEuroCurrency } from "@/lib/formatters"
import { calculateSubscriptionPrice, clampToRange, getPaymentPeriodDiscount, getPaymentPeriodSuffix, type PaymentPeriod } from "@/lib/subscriptionCalculator"
import { IconBolt, IconBuildingStore, IconCloud, IconServer, IconSparkles, IconUsers } from "@tabler/icons-react"
import { useParams, useSearchParams } from "next/navigation"
import type { ReactNode } from "react"

type CheckoutSummaryContent = CheckoutData["summary"]

interface CheckoutSummaryProps {
    content?: CheckoutSummaryContent | null
    subscriptionConfig?: SubscriptionConfigData | null
}

interface SummaryRowProps {
    icon: ReactNode
    label: string
    value: ReactNode
    tone?: "neutral" | "brand" | "aqua" | "pink" | "yellow"
}

const defaultSummaryContent: CheckoutSummaryContent = {
    eyebrow: "Order Summary",
    heading: "Review your configuration",
    description: "This checkout reflects the subscription shape you configured, including runtime and optional add-ons.",
    deploymentLabel: "Deployment",
    customerTypeLabel: "Customer Type",
    workflowExecutionsLabel: "Workflow Executions",
    additionalFeaturesLabel: "Additional Features",
    additionalFeaturesDescription: "Selected add-ons that extend the base subscription.",
    pricing: {
        label: "Pricing",
        description: "Monthly breakdown based on your current setup.",
        baseLabel: "AI Tokens",
        workflowExecutionsLabel: "Workflow Executions",
        additionalFeaturesLabel: "Additional Features",
        totalLabel: "Total",
        perMonthSuffix: "/mo",
    },
}

function SummaryRow({ icon, label, value, tone = "neutral" }: SummaryRowProps) {
    const iconToneClassName = {
        neutral: "text-white/65",
        brand: "text-brand",
        aqua: "text-aqua",
        pink: "text-pink",
        yellow: "text-yellow",
    }[tone]

    return (
        <div className="flex items-center gap-3 py-1">
            <div className="flex min-w-0 items-center gap-3">
                <div className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 ${iconToneClassName}`}>{icon}</div>
                <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wider text-white/50">{label}</p>
                    <div className="mt-0.5 text-sm text-white/88">{value}</div>
                </div>
            </div>
        </div>
    )
}

function parseNumber(value: string | null, fallback: number) {
    if (value === null || value.trim() === "") return fallback

    const parsedValue = Number(value)
    return Number.isFinite(parsedValue) ? parsedValue : fallback
}

export function CheckoutSummary({ content, subscriptionConfig }: CheckoutSummaryProps) {
    const searchParams = useSearchParams()
    const params = useParams<{ locale?: string }>()
    const labels = content ?? defaultSummaryContent

    const deployment = searchParams.get("deployment")
    const customerType = searchParams.get("customerType")
    const paymentPeriod = searchParams.get("paymentPeriod")
    const workflowExecutionsParam = searchParams.get("workflowExecutions")
    const aiTokensParam = searchParams.get("aiTokens")
    const additionalFeaturesParam = searchParams.get("additionalFeatures")
    const selectedAdditionalFeatureIds =
        additionalFeaturesParam
            ?.split(",")
            .map((feature) => feature.trim())
            .filter((feature) => feature.length > 0) ?? []
    const configuredAdditionalFeatures = subscriptionConfig?.additionalFeatures ?? []
    const selectedAdditionalFeatures = selectedAdditionalFeatureIds.flatMap((selectedFeatureId) => {
        const matchingFeature = configuredAdditionalFeatures.find((feature, index) => String(feature.id ?? index) === selectedFeatureId)
        return matchingFeature ? [matchingFeature] : []
    })
    const additionalFeaturesPrice = selectedAdditionalFeatures.reduce((total, feature) => total + feature.price, 0)
    const normalizedCustomerType = customerType === "b2b" || customerType === "b2c" ? customerType : (subscriptionConfig?.defaults.customerType ?? "b2b")
    const normalizedPaymentPeriod: PaymentPeriod =
        paymentPeriod === "quarterly" || paymentPeriod === "yearly" || paymentPeriod === "monthly" ? paymentPeriod : (subscriptionConfig?.defaults.paymentPeriod ?? "monthly")
    const defaultWorkflowExecutions = subscriptionConfig?.defaults.workflowExecutions[normalizedCustomerType] ?? 200
    const defaultAiTokens = subscriptionConfig?.defaults.aiTokens[normalizedCustomerType] ?? 0
    const workflowExecutions = subscriptionConfig
        ? clampToRange(parseNumber(workflowExecutionsParam, defaultWorkflowExecutions), subscriptionConfig.workflowExecutions[normalizedCustomerType])
        : parseNumber(workflowExecutionsParam, defaultWorkflowExecutions)
    const aiTokens = subscriptionConfig ? clampToRange(parseNumber(aiTokensParam, defaultAiTokens), subscriptionConfig.aiTokens[normalizedCustomerType]) : parseNumber(aiTokensParam, defaultAiTokens)
    const discount = subscriptionConfig ? getPaymentPeriodDiscount(normalizedPaymentPeriod, subscriptionConfig.paymentPeriod) : 0
    const pricing = calculateSubscriptionPrice({
        additionalFeaturesPrice,
        aiTokenPriceFactor: subscriptionConfig?.aiTokenPriceFactor ?? 0,
        aiTokens,
        discount,
        workflowExecutionPriceFactor: subscriptionConfig?.workflowExecutionPriceFactor ?? 0,
        workflowExecutions,
    })
    const locale = params?.locale === "de" ? "de" : "en"
    const formattedTotalPrice = formatEuroCurrency(pricing.totalPrice, locale)
    const formattedBasePrice = formatEuroCurrency(pricing.aiTokenPrice, locale)
    const formattedWorkflowExecutionsPrice = formatEuroCurrency(pricing.workflowExecutionPrice, locale)
    const formattedAdditionalFeaturesPrice = formatEuroCurrency(additionalFeaturesPrice, locale)
    const periodSuffix = subscriptionConfig ? getPaymentPeriodSuffix(normalizedPaymentPeriod, subscriptionConfig.paymentPeriod) : labels.pricing.perMonthSuffix

    return (
        <div className="flex-1 h-max pl-3">
            <div className="mb-5">
                <p className="font-semibold tracking-wider text-brand">{labels.eyebrow}</p>
                <h2 className="mt-3 text-2xl font-bold text-white">{labels.heading}</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/60">{labels.description}</p>
            </div>

            <div className="space-y-2">
                {deployment && (
                    <SummaryRow
                        icon={deployment === "cloud" ? <IconCloud size={16} /> : <IconServer size={16} />}
                        label={labels.deploymentLabel}
                        tone="aqua"
                        value={<span className="capitalize">{deployment.replace("-", " ")}</span>}
                    />
                )}

                {customerType && (
                    <SummaryRow
                        icon={customerType === "b2c" ? <IconBuildingStore size={16} /> : <IconUsers size={16} />}
                        label={labels.customerTypeLabel}
                        tone="yellow"
                        value={<span className="uppercase">{customerType}</span>}
                    />
                )}

                {workflowExecutionsParam && <SummaryRow icon={<IconBolt size={16} />} label={labels.workflowExecutionsLabel} tone="brand" value={<span>{workflowExecutions}</span>} />}

                {selectedAdditionalFeatures.length > 0 && (
                    <SummaryRow
                        icon={<IconSparkles size={16} />}
                        label={labels.additionalFeaturesLabel}
                        tone="yellow"
                        value={<span>{selectedAdditionalFeatures.map((feature) => feature.title).join(", ")}</span>}
                    />
                )}

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/2 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                    <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-3">
                        <div>
                            <p className="text-xs font-semibold tracking-wider text-white/50">{labels.pricing.label}</p>
                            <p className="mt-1 text-sm text-white">{labels.pricing.description}</p>
                        </div>
                    </div>

                    <div className="space-y-2 pt-4">
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-white/70">{labels.pricing.baseLabel}</span>
                            <span className="tabular-nums text-white/92">{formattedBasePrice}</span>
                        </div>

                        <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-white/70">{labels.pricing.workflowExecutionsLabel}</span>
                            <span className="tabular-nums text-white/92">{formattedWorkflowExecutionsPrice}</span>
                        </div>

                        {selectedAdditionalFeatures.length > 0 && (
                            <div className="flex items-center justify-between gap-4 text-sm">
                                <span className="text-white/70">{labels.pricing.additionalFeaturesLabel}</span>
                                <span className="tabular-nums text-white/92">{formattedAdditionalFeaturesPrice}</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/8 pt-4 text-lg font-semibold">
                        <span className="text-white">{labels.pricing.totalLabel}</span>
                        <span className="tabular-nums text-brand">
                            {formattedTotalPrice}
                            {periodSuffix}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
