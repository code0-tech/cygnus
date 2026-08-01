"use client"

import { WorkflowCalculatorDialog } from "@/components/checkout/WorkflowCalculatorDialog"
import { SubscriptionAdditionalFeature } from "@/components/subscription/SubscriptionAdditionalFeature"
import { SubscriptionOptionCard } from "@/components/subscription/SubscriptionOptionCard"
import { HapticButtonLink } from "@/components/ui/HapticButtonLink"
import { Slider } from "@/components/ui/Slider"
import type { SubscriptionConfiguratorContent } from "@/lib/cms"
import { formatEuroCurrency } from "@/lib/formatters"
import type { AppLocale } from "@/lib/i18n"
import { calculateSubscriptionPrice, formatDiscountBadge, getPaymentPeriodDiscount, getPaymentPeriodMonths, getPaymentPeriodSuffix } from "@/lib/subscriptionCalculator"
import {
    buildSubscriptionSelectionSearchParams,
    getPaymentPeriodForCustomerType,
    getPlanForCustomerType,
    parseSelectedAdditionalFeatureIndexes,
    parseSubscriptionSelectionFromSearchParams,
    type SubscriptionSelection,
} from "@/lib/subscriptionConfigurator"
import NumberFlow from "@number-flow/react"
import { IconCalendarMonth } from "@tabler/icons-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { Card } from "../ui/Card"
import { LinkButton } from "../ui/LinkButton"

export interface SubscriptionIcons {
    deployment: {
        selfHosted: ReactNode
        cloud: ReactNode
    }
    plan: {
        pro: ReactNode
        max: ReactNode
        custom: ReactNode
    }
    customerType: {
        b2b: ReactNode
        b2c: ReactNode
    }
    workflowBusinessTypes: ReactNode[]
    additionalFeatures: ReactNode[]
}

const B2B_PAYMENT_PERIOD_OPTIONS = ["monthly", "quarterly", "yearly"] as const
const B2C_PAYMENT_PERIOD_OPTIONS = ["weekly", "monthly", "yearly"] as const

export function SubscriptionConfigurator({ locale, content, icons }: { locale: AppLocale; content: SubscriptionConfiguratorContent; icons: SubscriptionIcons }) {
    const workflowExecutions = content.workflowExecutions
    const aiTokens = content.aiTokens
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [selection, setSelection] = useState<SubscriptionSelection>(() => parseSubscriptionSelectionFromSearchParams(searchParams, content))
    const workflowExecutionRange = workflowExecutions[selection.customerType]
    const aiTokenRange = aiTokens[selection.customerType]
    const [selectedFeatures, setSelectedFeatures] = useState<Set<number>>(() => parseSelectedAdditionalFeatureIndexes(searchParams, content.additionalFeatures))
    const additionalFeaturesPrice = Array.from(selectedFeatures).reduce((acc, idx) => acc + (content.additionalFeatures?.[idx]?.price ?? 0), 0)
    const paymentPeriodOptions = selection.customerType === "b2b" ? B2B_PAYMENT_PERIOD_OPTIONS : B2C_PAYMENT_PERIOD_OPTIONS
    const paymentPeriodDiscount = getPaymentPeriodDiscount(selection.paymentPeriod, content.paymentPeriod)
    const paymentPeriodSuffix = getPaymentPeriodSuffix(selection.paymentPeriod, content.paymentPeriod)
    const { totalPrice: customPlanPrice } = calculateSubscriptionPrice({
        additionalFeaturesPrice,
        aiTokenPriceFactor: content.aiTokenPriceFactor,
        aiTokens: selection.aiTokens,
        billingPeriodMonths: getPaymentPeriodMonths(selection.paymentPeriod),
        discount: paymentPeriodDiscount,
        workflowExecutionPriceFactor: content.workflowExecutionPriceFactor,
        workflowExecutions: selection.workflowExecutions,
    })
    const totalPrice = selection.plan === "custom" ? customPlanPrice : content.packages[selection.plan].prices[selection.paymentPeriod]
    const additionalFeatureIds = Array.from(selectedFeatures).map((idx) => content.additionalFeatures?.[idx]?.id ?? String(idx))
    const selectionSearchParamsString = buildSubscriptionSelectionSearchParams(selection, additionalFeatureIds).toString()
    const subscribeHref = `${content.subscribe.baseUrl}?${selectionSearchParamsString}`

    useEffect(() => {
        router.replace(`${pathname}?${selectionSearchParamsString}`, { scroll: false })
    }, [pathname, router, selectionSearchParamsString])

    return (
        <Card size="lg" variant="light" className="min-w-0 lg:col-span-2">
            <div className="relative z-10 flex flex-col gap-6">
                <h2 className="text-2xl font-semibold text-white lg:text-3xl">{content.optionsPanelHeading}</h2>

                <div className="space-y-2">
                    <div>
                        <p className="text-white">{content.customerType.label}</p>
                    </div>
                    <div className="grid gap-3">
                        <SubscriptionOptionCard
                            title={content.customerType.b2b.title}
                            description={content.customerType.b2b.description}
                            icon={icons.customerType.b2b}
                            accent={content.customerType.b2b.color}
                            active={selection.customerType === "b2b"}
                            onClick={() =>
                                setSelection((current) => ({
                                    ...current,
                                    plan: getPlanForCustomerType("b2b", current.plan),
                                    customerType: "b2b",
                                    paymentPeriod: getPaymentPeriodForCustomerType("b2b", current.paymentPeriod),
                                    workflowExecutions: workflowExecutions.b2b.default,
                                    aiTokens: aiTokens.b2b.default,
                                }))
                            }
                        />
                        <SubscriptionOptionCard
                            title={content.customerType.b2c.title}
                            description={content.customerType.b2c.description}
                            icon={icons.customerType.b2c}
                            accent={content.customerType.b2c.color}
                            active={selection.customerType === "b2c"}
                            onClick={() =>
                                setSelection((current) => ({
                                    ...current,
                                    customerType: "b2c",
                                    paymentPeriod: getPaymentPeriodForCustomerType("b2c", current.paymentPeriod),
                                    workflowExecutions: workflowExecutions.b2c.default,
                                    aiTokens: aiTokens.b2c.default,
                                }))
                            }
                        />
                    </div>
                </div>

                {selection.customerType === "b2c" && (
                    <div className="space-y-2">
                        <div>
                            <p className="text-white">{content.plan.title}</p>
                        </div>
                        <div className="grid gap-3">
                            {selection.customerType === "b2c" && (
                                <>
                                    <SubscriptionOptionCard
                                        title={content.plan.pro.title}
                                        description={content.plan.pro.description}
                                        icon={icons.plan.pro}
                                        accent="brand"
                                        active={selection.plan === "pro"}
                                        onClick={() => setSelection((current) => ({ ...current, plan: "pro" }))}
                                    />
                                    <SubscriptionOptionCard
                                        title={content.plan.max.title}
                                        description={content.plan.max.description}
                                        icon={icons.plan.max}
                                        accent="magenta"
                                        active={selection.plan === "max"}
                                        onClick={() => setSelection((current) => ({ ...current, plan: "max" }))}
                                    />
                                </>
                            )}
                            <SubscriptionOptionCard
                                title={content.plan.custom.title}
                                description={content.plan.custom.description}
                                icon={icons.plan.custom}
                                accent="aqua"
                                active={selection.plan === "custom"}
                                onClick={() => setSelection((current) => ({ ...current, plan: "custom" }))}
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <div>
                        <p className="text-white">{content.deployment.label}</p>
                    </div>
                    <div className="grid gap-3">
                        <SubscriptionOptionCard
                            title={content.deployment.selfHosted.title}
                            description={content.deployment.selfHosted.description}
                            icon={icons.deployment.selfHosted}
                            accent={content.deployment.selfHosted.color}
                            active={selection.deployment === "self_hosted"}
                            onClick={() => setSelection((current) => ({ ...current, deployment: "self_hosted" }))}
                        />
                        <SubscriptionOptionCard
                            title={content.deployment.cloud.title}
                            description={content.deployment.cloud.description}
                            icon={icons.deployment.cloud}
                            accent={content.deployment.cloud.color}
                            active={selection.deployment === "cloud"}
                            onClick={() => setSelection((current) => ({ ...current, deployment: "cloud" }))}
                        />
                    </div>
                </div>

                {selection.plan === "custom" && (
                    <div className="space-y-2">
                        <div>
                            <p className="text-white">{aiTokens.title}</p>
                        </div>
                        <Slider
                            min={aiTokenRange.min}
                            max={aiTokenRange.max}
                            step={aiTokenRange.step}
                            value={selection.aiTokens}
                            onChange={(aiTokensValue) => setSelection((current) => ({ ...current, aiTokens: aiTokensValue }))}
                            ariaLabel={aiTokens.title}
                            className="mt-4"
                            valueLabelSuffix={aiTokens.suffix}
                            centerLabelSuffix={paymentPeriodSuffix}
                        />
                    </div>
                )}

                {selection.plan === "custom" && (
                    <div className="space-y-2">
                        <div>
                            <p className="text-white">{workflowExecutions.title}</p>
                        </div>
                        <Slider
                            min={workflowExecutionRange.min}
                            max={workflowExecutionRange.max}
                            step={workflowExecutionRange.step}
                            value={selection.workflowExecutions}
                            onChange={(workflowExecutionsValue) => setSelection((current) => ({ ...current, workflowExecutions: workflowExecutionsValue }))}
                            ariaLabel={workflowExecutions.title}
                            className="mt-4"
                            valueLabelSuffix={workflowExecutions.suffix}
                            centerLabelSuffix={paymentPeriodSuffix}
                        />
                        <div className="mt-2 flex w-full items-center justify-between gap-4">
                            <WorkflowCalculatorDialog
                                locale={locale}
                                content={content.workflowCalculator}
                                businessTypeIcons={icons.workflowBusinessTypes}
                                value={selection.workflowExecutions}
                                min={workflowExecutionRange.min}
                                max={workflowExecutionRange.max}
                                step={workflowExecutionRange.step}
                                suffix={workflowExecutions.suffix}
                                centerLabelSuffix={paymentPeriodSuffix}
                                onApply={(workflowExecutionsValue) => setSelection((current) => ({ ...current, workflowExecutions: workflowExecutionsValue }))}
                            />
                            <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                                <p className="text-sm font-medium text-tertiary">{content.contactSales.prompt}</p>
                                <LinkButton href={content.contactSales.href} className="border-b-0 text-secondary" showArrow={false}>
                                    {content.contactSales.label}
                                </LinkButton>
                            </div>
                        </div>
                    </div>
                )}

                {selection.plan === "custom" && content.additionalFeatures && content.additionalFeatures.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-base text-secondary">{content.additionalFeaturesLabel ?? "Additional Features"}</p>
                        <div className="grid gap-3">
                            {content.additionalFeatures.map((feature, index) => {
                                const formattedFeaturePrice = formatEuroCurrency(feature.price, locale)
                                return (
                                    <SubscriptionAdditionalFeature
                                        key={feature.id ?? `feature-${index}`}
                                        title={feature.title}
                                        description={feature.description}
                                        icon={icons.additionalFeatures[index]}
                                        formattedPrice={`+${formattedFeaturePrice}/mo`}
                                        active={selectedFeatures.has(index)}
                                        onClick={() => {
                                            setSelectedFeatures((prev) => {
                                                const next = new Set(prev)
                                                if (next.has(index)) {
                                                    next.delete(index)
                                                } else {
                                                    next.add(index)
                                                }
                                                return next
                                            })
                                        }}
                                    />
                                )
                            })}
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <div>
                        <p className="text-white">{content.paymentPeriod.label}</p>
                    </div>
                    <div className="grid gap-3">
                        {paymentPeriodOptions.map((period) => {
                            const discount = getPaymentPeriodDiscount(period, content.paymentPeriod)

                            return (
                                <SubscriptionOptionCard
                                    key={period}
                                    title={content.paymentPeriod[`${period}Text`]}
                                    description={content.paymentPeriod[`${period}PeriodSuffix`]}
                                    icon={<IconCalendarMonth size={18} />}
                                    accent={content.paymentPeriod[`${period}Color`]}
                                    badge={discount > 0 ? `-${formatDiscountBadge(discount, locale)}` : undefined}
                                    active={selection.paymentPeriod === period}
                                    onClick={() => setSelection((current) => ({ ...current, paymentPeriod: period }))}
                                />
                            )
                        })}
                    </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                    <div className="mb-3 flex min-w-0 items-baseline justify-end gap-2 text-right">
                        <span className="text-xs font-semibold tracking-wide text-tertiary">{content.price.heading}</span>
                        <NumberFlow
                            value={totalPrice}
                            locales={locale === "de" ? "de-DE" : "en-US"}
                            format={{ style: "currency", currency: "EUR", trailingZeroDisplay: "stripIfInteger" }}
                            className="text-xl font-semibold text-brand"
                        />
                        <span className="max-w-28 truncate text-xs text-tertiary">{paymentPeriodSuffix}</span>
                    </div>
                    <HapticButtonLink href={subscribeHref} variant="filled" className="h-10! w-full! bg-white/80! font-semibold! text-primary! hover:bg-white!">
                        {content.subscribe.label}
                    </HapticButtonLink>
                </div>
            </div>
        </Card>
    )
}
