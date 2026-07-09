"use client"

import type { SubscriptionConfigData } from "@/lib/cms"
import { formatEuroCurrency } from "@/lib/formatters"
import type { AppLocale } from "@/lib/i18n"
import { useDesktopPinnedPosition } from "@/hooks/useDesktopPinnedPosition"
import { cn } from "@/lib/utils"
import { BuyMenu } from "@/components/BuyMenu"
import { WorkflowCalculatorDialog } from "@/components/dialogs/WorkflowCalculatorDialog"
import { Slider } from "@/components/ui/Slider"
import { IconCheck } from "@tabler/icons-react"
import type { CSSProperties, ReactNode } from "react"
import { useState } from "react"
import { LinkButton } from "./ui/LinkButton"
import { Card } from "./ui/Card"

type DeploymentMode = "self-hosted" | "cloud"
type CustomerType = "b2b" | "b2c"
type PaymentPeriod = "monthly" | "quarterly" | "yearly"
type OptionAccent = "aqua" | "yellow" | "pink" | "blue" | "brand"
type SubscriptionSelection = {
    deployment: DeploymentMode
    customerType: CustomerType
    paymentPeriod: PaymentPeriod
    workflowExecutions: number
    aiTokens: number
}
type UsageRange = {
    min: number
    max: number
    step: number
}

export interface SubscriptionIcons {
    featureOverview: ReactNode[]
    deployment: {
        selfHosted: ReactNode
        cloud: ReactNode
    }
    customerType: {
        b2b: ReactNode
        b2c: ReactNode
    }
    workflowBusinessTypes: ReactNode[]
    additionalFeatures: ReactNode[]
}

const ACTIVE_ACCENT_GLOW_STYLE: CSSProperties = {
    background: "radial-gradient(circle at top right, color-mix(in oklab, var(--option-accent) 16%, transparent), transparent 38%)",
}

const ACTIVE_ACCENT_ICON_STYLE: CSSProperties = {
    color: "var(--option-accent)",
}

function getOptionAccentStyle(accent: OptionAccent, active: boolean): CSSProperties {
    const accentColor = `var(--bg-${accent})`

    return {
        "--option-accent": accentColor,
        ...(active && {
            borderColor: `color-mix(in oklab, ${accentColor} 60%, transparent)`,
            background: `linear-gradient(to bottom right, color-mix(in oklab, ${accentColor} 14%, transparent), rgba(255, 255, 255, 0.04), transparent)`,
            boxShadow: `0 0 0 1px color-mix(in oklab, ${accentColor} 25%, transparent)`,
        }),
    } as CSSProperties
}

interface OptionCardProps {
    title: string
    description: string
    active: boolean
    onClick?: () => void
    icon: ReactNode
    disabled?: boolean
    accent?: OptionAccent
}

interface FeatureRowProps {
    icon: ReactNode
    title: string
    description: string
}

interface AdditionalFeatureCardProps {
    title: string
    description: string
    active: boolean
    onClick?: () => void
    icon: ReactNode
    formattedPrice: string
}

interface PaymentPeriodSwitchProps {
    content: SubscriptionConfigData["paymentPeriod"]
    locale: AppLocale
    value: PaymentPeriod
    onChange: (value: PaymentPeriod) => void
}

const paymentPeriodOptions = [
    { value: "monthly", textKey: "monthlyText", indicatorClassName: "translate-x-0" },
    { value: "quarterly", textKey: "quarterlyText", indicatorClassName: "translate-x-full" },
    { value: "yearly", textKey: "yearlyText", indicatorClassName: "translate-x-[200%]" },
] as const

function OptionCard({ title, description, active, onClick, icon, disabled = false, accent = "aqua" }: OptionCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            style={getOptionAccentStyle(accent, active)}
            className={cn(
                "relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300",
                disabled ? "cursor-not-allowed border-white/10 opacity-45" : "border-white/10 hover:bg-light"
            )}
        >
            <div className="relative z-10 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <div className="relative inline-flex shrink-0 items-center justify-center">
                        {active ? (
                            <div
                                aria-hidden="true"
                                style={ACTIVE_ACCENT_GLOW_STYLE}
                                className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl"
                            />
                        ) : null}
                        <div style={active ? ACTIVE_ACCENT_ICON_STYLE : undefined} className="relative inline-flex items-center justify-center text-secondary [&>svg]:h-[1.05em] [&>svg]:w-[1.05em]">
                            {icon}
                        </div>
                    </div>
                    <p className="text-base font-semibold text-white">{title}</p>
                </div>
                <p className="text-sm leading-6 text-secondary">{description}</p>
            </div>
        </button>
    )
}

function PaymentPeriodSwitch({ content, locale, value, onChange }: PaymentPeriodSwitchProps) {
    const activeOption = paymentPeriodOptions.find((option) => option.value === value) ?? paymentPeriodOptions[0]

    return (
        <div className="space-y-3">
            <div>
                <p className="text-base text-secondary">{content.label}</p>
                <p className="mt-1 text-sm text-tertiary">{content.description}</p>
            </div>
            <div className="relative grid grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-white/3 p-1">
                <div
                    className={cn(
                        "absolute left-1 top-1 h-[calc(100%-0.5rem)] w-[calc((100%-0.5rem)/3)] rounded-xl bg-white/10 transition-transform duration-300 ease-out",
                        activeOption.indicatorClassName
                    )}
                />
                {paymentPeriodOptions.map((option) => {
                    const active = value === option.value
                    const discount = getPaymentPeriodDiscount(option.value, content)

                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onChange(option.value)}
                            className={cn("relative z-10 min-w-0 rounded-xl px-3 py-2 text-sm font-medium transition-colors", active ? "text-white" : "text-secondary hover:text-white")}
                        >
                            <span className="inline-flex min-w-0 items-center justify-center gap-1">
                                <span className="min-w-0 truncate">{content[option.textKey]}</span>
                                {discount > 0 ? (
                                    <span className={cn("shrink-0 rounded-full -mt-3 px-1 py-0.5 text-[10px] tracking-wider leading-none bg-brand/15 text-brand")}>
                                        -{formatDiscountBadge(discount, locale)}
                                    </span>
                                ) : null}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

function FeatureRow({ icon, title, description }: FeatureRowProps) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <div className="inline-flex shrink-0 items-center justify-center text-brand [&>svg]:h-[1.05em] [&>svg]:w-[1.05em]">{icon}</div>
                <p className="text-base font-semibold tracking-wider text-white">{title}</p>
            </div>
            <p className="text-sm text-secondary">{description}</p>
        </div>
    )
}

function AdditionalFeatureCard({ title, description, active, onClick, icon, formattedPrice }: AdditionalFeatureCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={getOptionAccentStyle("brand", active)}
            className="relative overflow-hidden rounded-2xl border border-white/10 p-4 text-left transition-all duration-300 hover:bg-light"
        >
            <div className="relative z-10 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <div className="relative inline-flex shrink-0 items-center justify-center">
                        {active ? (
                            <div
                                aria-hidden="true"
                                style={ACTIVE_ACCENT_GLOW_STYLE}
                                className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl"
                            />
                        ) : null}
                        <div style={active ? ACTIVE_ACCENT_ICON_STYLE : undefined} className="relative inline-flex items-center justify-center text-secondary [&>svg]:h-[1.05em] [&>svg]:w-[1.05em]">
                            {icon}
                        </div>
                    </div>
                    <p className="text-base font-semibold text-white">{title}</p>
                </div>
                <p className="text-sm leading-6 text-secondary">{description}</p>
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold tabular-nums text-secondary">{formattedPrice}</p>
                    <div
                        className={cn("flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-200", active ? "border-brand bg-brand" : "border-white/20 bg-transparent")}
                    >
                        {active && <IconCheck size={12} stroke={3} className="text-primary" />}
                    </div>
                </div>
            </div>
        </button>
    )
}

function clampToRange(value: number, range: UsageRange) {
    return Math.min(Math.max(value, range.min), range.max)
}

function formatDiscountBadge(discount: number, locale: AppLocale) {
    return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", {
        style: "percent",
        maximumFractionDigits: 0,
    }).format(discount)
}

function getPaymentPeriodDiscount(period: PaymentPeriod, paymentPeriod: SubscriptionConfigData["paymentPeriod"]) {
    if (period === "quarterly") return paymentPeriod.quarterlyDiscount
    if (period === "yearly") return paymentPeriod.yearlyDiscount
    return 0
}

export function SubscriptionConfigurator({ locale, content, icons }: { locale: AppLocale; content: SubscriptionConfigData; icons: SubscriptionIcons }) {
    const workflowExecutions = content.workflowExecutions
    const aiTokens = content.aiTokens
    const defaultSelection = content.defaults
    const defaultWorkflowExecutionRange = workflowExecutions[defaultSelection.customerType]
    const defaultAiTokenRange = aiTokens[defaultSelection.customerType]
    const defaultWorkflowExecutions = defaultSelection.workflowExecutions[defaultSelection.customerType]
    const defaultAiTokens = defaultSelection.aiTokens[defaultSelection.customerType]

    const [selection, setSelection] = useState<SubscriptionSelection>({
        deployment: defaultSelection.deployment,
        customerType: defaultSelection.customerType,
        paymentPeriod: defaultSelection.paymentPeriod,
        workflowExecutions: clampToRange(defaultWorkflowExecutions, defaultWorkflowExecutionRange),
        aiTokens: clampToRange(defaultAiTokens, defaultAiTokenRange),
    })
    const workflowExecutionRange = workflowExecutions[selection.customerType]
    const aiTokenRange = aiTokens[selection.customerType]
    const [selectedFeatures, setSelectedFeatures] = useState<Set<number>>(new Set())
    const { wrapperRef: desktopWrapperRef, containerRef: desktopContainerRef } = useDesktopPinnedPosition<HTMLDivElement, HTMLDivElement>(96)

    const workflowExecutionPrice = content.workflowExecutionPriceFactor * selection.workflowExecutions
    const aiTokenPrice = content.aiTokenPriceFactor * selection.aiTokens
    const additionalFeaturesPrice = Array.from(selectedFeatures).reduce((acc, idx) => acc + (content.additionalFeatures?.[idx]?.price ?? 0), 0)
    const paymentPeriodDiscount = getPaymentPeriodDiscount(selection.paymentPeriod, content.paymentPeriod)
    const totalBeforeDiscount = workflowExecutionPrice + aiTokenPrice + additionalFeaturesPrice
    const totalPrice = totalBeforeDiscount * (1 - paymentPeriodDiscount)

    const subscribeHref = (() => {
        const searchParams = new URLSearchParams({
            deployment: selection.deployment,
            customerType: selection.customerType,
            paymentPeriod: selection.paymentPeriod,
            workflowExecutions: String(selection.workflowExecutions),
            aiTokens: String(selection.aiTokens),
        })

        if (selectedFeatures.size > 0 && content.additionalFeatures) {
            const featureIds = Array.from(selectedFeatures)
                .map((idx) => content.additionalFeatures![idx]?.id ?? String(idx))
                .join(",")
            searchParams.set("additionalFeatures", featureIds)
        }

        return `${content.subscribe.baseUrl}?${searchParams.toString()}`
    })()

    return (
        <>
            <div className="grid gap-8 lg:grid-cols-5">
                <section ref={desktopWrapperRef} className="relative min-w-0 lg:col-span-2">
                    <div ref={desktopContainerRef} className="relative z-10 flex min-w-0 flex-col gap-12">
                        <div className="max-w-2xl">
                            <h1 className="mt-4 max-w-xl text-balance text-3xl font-semibold text-white lg:text-4xl">{content.pageIntro.heading}</h1>
                            <p className="mt-4 max-w-xl text-base leading-7 text-secondary lg:text-lg">{content.pageIntro.description}</p>
                        </div>

                        <div className="grid gap-6">
                            {content.featureOverview.map((item, index) => (
                                <FeatureRow key={item.id ?? `${item.title}-${index}`} icon={icons.featureOverview[index]} title={item.title} description={item.description} />
                            ))}
                        </div>
                    </div>
                </section>

                <Card size="lg" className="lg:col-span-3 min-w-0 bg-primary">
                    <div className="relative z-10 flex flex-col gap-8">
                        <h2 className="text-2xl font-semibold text-white lg:text-3xl">{content.optionsPanelHeading}</h2>

                        <PaymentPeriodSwitch
                            content={content.paymentPeriod}
                            locale={locale}
                            value={selection.paymentPeriod}
                            onChange={(paymentPeriod) => setSelection((current) => ({ ...current, paymentPeriod }))}
                        />

                        <div className="space-y-2">
                            <p className="text-base text-secondary">{content.deployment.label}</p>
                            <div className="grid gap-3 md:grid-cols-2">
                                <OptionCard
                                    title={content.deployment.selfHosted.title}
                                    description={content.deployment.selfHosted.description}
                                    icon={icons.deployment.selfHosted}
                                    accent={content.deployment.selfHosted.color}
                                    active={selection.deployment === "self-hosted"}
                                    onClick={() => setSelection((current) => ({ ...current, deployment: "self-hosted" }))}
                                />
                                <OptionCard
                                    title={content.deployment.cloud.title}
                                    description={content.deployment.cloud.description}
                                    icon={icons.deployment.cloud}
                                    accent={content.deployment.cloud.color}
                                    active={selection.deployment === "cloud"}
                                    onClick={() => setSelection((current) => ({ ...current, deployment: "cloud" }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-base text-secondary">{content.customerType.label}</p>
                            <div className="grid gap-3 md:grid-cols-2">
                                <OptionCard
                                    title={content.customerType.b2b.title}
                                    description={content.customerType.b2b.description}
                                    icon={icons.customerType.b2b}
                                    accent={content.customerType.b2b.color}
                                    active={selection.customerType === "b2b"}
                                    onClick={() =>
                                        setSelection((current) => ({
                                            ...current,
                                            customerType: "b2b",
                                            workflowExecutions: clampToRange(current.workflowExecutions, workflowExecutions.b2b),
                                            aiTokens: clampToRange(current.aiTokens, aiTokens.b2b),
                                        }))
                                    }
                                />
                                <OptionCard
                                    title={content.customerType.b2c.title}
                                    description={content.customerType.b2c.description}
                                    icon={icons.customerType.b2c}
                                    accent={content.customerType.b2c.color}
                                    active={selection.customerType === "b2c"}
                                    onClick={() =>
                                        setSelection((current) => ({
                                            ...current,
                                            customerType: "b2c",
                                            workflowExecutions: clampToRange(current.workflowExecutions, workflowExecutions.b2c),
                                            aiTokens: clampToRange(current.aiTokens, aiTokens.b2c),
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-lg font-semibold tracking-wider text-white">{workflowExecutions.title}</p>
                                    <p className="text-sm text-secondary">{workflowExecutions.description}</p>
                                </div>
                                <WorkflowCalculatorDialog
                                    locale={locale}
                                    content={content.workflowCalculator}
                                    businessTypeIcons={icons.workflowBusinessTypes}
                                    value={selection.workflowExecutions}
                                    min={workflowExecutionRange.min}
                                    max={workflowExecutionRange.max}
                                    step={workflowExecutionRange.step}
                                    suffix={workflowExecutions.suffix}
                                    onApply={(workflowExecutionsValue) => setSelection((current) => ({ ...current, workflowExecutions: workflowExecutionsValue }))}
                                />
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
                            />
                            <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                                <p className="text-sm font-medium text-tertiary">{content.contactSales.prompt}</p>
                                <LinkButton href={content.contactSales.href} className="border-b-0 text-secondary" showArrow={false}>
                                    {content.contactSales.label}
                                </LinkButton>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-lg font-semibold tracking-wider text-white">{aiTokens.title}</p>
                                    <p className="text-sm text-secondary">{aiTokens.description}</p>
                                </div>
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
                            />
                        </div>

                        {content.additionalFeatures && content.additionalFeatures.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-base text-secondary">{content.additionalFeaturesLabel ?? "Additional Features"}</p>
                                <div className="grid gap-3">
                                    {content.additionalFeatures.map((feature, index) => {
                                        const formattedFeaturePrice = formatEuroCurrency(feature.price, locale)
                                        return (
                                            <AdditionalFeatureCard
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
                    </div>
                </Card>
            </div>
            <BuyMenu price={totalPrice} priceHeading={content.price.heading} priceCaption={content.price.caption} subscribeHref={subscribeHref} subscribeLabel={content.subscribe.label} />
        </>
    )
}
