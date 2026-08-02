"use client"

import { WorkflowCalculatorDialog } from "@/components/checkout/WorkflowCalculatorDialog"
import { SubscriptionAdditionalFeature } from "@/components/subscription/SubscriptionAdditionalFeature"
import { SubscriptionOptionCard } from "@/components/subscription/SubscriptionOptionCard"
import { HapticButtonLink } from "@/components/ui/HapticButtonLink"
import { FormattedText, hasHighlightedText } from "@/components/ui/FormattedText"
import { Slider } from "@/components/ui/Slider"
import type { SubscriptionConfiguratorContent } from "@/lib/cms"
import { formatEuroCurrency } from "@/lib/formatters"
import type { AppLocale } from "@/lib/i18n"
import { getSubscriptionCatalog } from "@/lib/subscriptionCatalog"
import { calculateSubscriptionQuote, formatDiscountBadge, getMonthlyEquivalentAmount, getPaymentPeriodDiscount, getPaymentPeriodSuffix } from "@/lib/subscriptionCalculator"
import { cn } from "@/lib/utils"
import {
    buildSubscriptionSelectionSearchParams,
    parseSubscriptionSelectionFromSearchParams,
    reduceSubscriptionSelection,
    type SubscriptionSelectionAction,
    type SubscriptionSelection,
} from "@/lib/subscriptionConfigurator"
import NumberFlow from "@number-flow/react"
import { IconCalendarMonth } from "@tabler/icons-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
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

export type SubscriptionOptionImageKey = "b2b" | "b2c" | "pro" | "max" | "custom" | "selfHosted" | "cloud"

const B2B_PAYMENT_PERIOD_OPTIONS = ["monthly", "quarterly", "yearly"] as const
const B2C_PAYMENT_PERIOD_OPTIONS = ["weekly", "monthly", "yearly"] as const

function SubscriptionOptionCategoryLabel({ label, description }: { label: string; description?: string | null }) {
    return (
        <div>
            <p className={cn("text-2xl font-semibold", hasHighlightedText(label) ? "text-secondary" : "text-white")}>
                <FormattedText text={label} />
            </p>
            {description && <p className="mt-2 text-base text-tertiary">{description}</p>}
        </div>
    )
}

interface SubscriptionConfiguratorProps {
    locale: AppLocale
    content: SubscriptionConfiguratorContent
    icons: SubscriptionIcons
    onActiveImageChangeAction?: (key: SubscriptionOptionImageKey) => void
}

export function SubscriptionConfigurator({ locale, content, icons, onActiveImageChangeAction }: SubscriptionConfiguratorProps) {
    const workflowExecutions = content.workflowExecutions
    const aiTokens = content.aiTokens
    const catalog = getSubscriptionCatalog(content)
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const configuratorRef = useRef<HTMLDivElement>(null)
    const configuratorEndRef = useRef<HTMLDivElement>(null)

    const [selection, setSelection] = useState<SubscriptionSelection>(() => parseSubscriptionSelectionFromSearchParams(searchParams, content))
    const [activeStepIndex, setActiveStepIndex] = useState(0)
    const [showBottomBlur, setShowBottomBlur] = useState(false)
    const [showStepIndicator, setShowStepIndicator] = useState(false)
    const workflowExecutionRange = workflowExecutions[selection.customerType]
    const aiTokenRange = aiTokens[selection.customerType]
    const pendingScrollStepKeyRef = useRef<string | null>(null)
    const dispatch = (action: SubscriptionSelectionAction) => setSelection((current) => reduceSubscriptionSelection(current, action, catalog))
    const selectOption = (action: SubscriptionSelectionAction, imageKey: SubscriptionOptionImageKey, stepKey: string) => {
        dispatch(action)
        onActiveImageChangeAction?.(imageKey)
        pendingScrollStepKeyRef.current = stepKey
    }
    const selectedFeatureIds = new Set(selection.additionalFeatureIds)
    const paymentPeriodOptions = selection.customerType === "b2b" ? B2B_PAYMENT_PERIOD_OPTIONS : B2C_PAYMENT_PERIOD_OPTIONS
    const paymentPeriodSuffix = getPaymentPeriodSuffix(selection.paymentPeriod, content.paymentPeriod)
    const monthlyPeriodSuffix = getPaymentPeriodSuffix("monthly", content.paymentPeriod)
    const monthlyPrice = getMonthlyEquivalentAmount(calculateSubscriptionQuote(selection, catalog).total, selection.paymentPeriod) / 100
    const selectionSearchParamsString = buildSubscriptionSelectionSearchParams(selection).toString()
    const subscribeHref = `${content.subscribe.baseUrl}?${selectionSearchParamsString}`
    const configuratorSteps = [
        content.customerType.label,
        ...(selection.customerType === "b2c" ? [content.plan.title] : []),
        content.deployment.label,
        ...(selection.plan === "custom" ? [aiTokens.title, workflowExecutions.title] : []),
        ...(selection.plan === "custom" && content.additionalFeatures?.length ? [content.additionalFeaturesLabel ?? "Additional Features"] : []),
        content.paymentPeriod.label,
    ]

    useEffect(() => {
        router.replace(`${pathname}?${selectionSearchParamsString}`, { scroll: false })
    }, [pathname, router, selectionSearchParamsString])

    useEffect(() => {
        const stepKey = pendingScrollStepKeyRef.current
        pendingScrollStepKeyRef.current = null
        if (!stepKey) return

        const currentStep = configuratorRef.current?.querySelector<HTMLElement>(`[data-subscription-step="${stepKey}"]`)
        const nextStep = currentStep?.nextElementSibling
        if (nextStep instanceof HTMLElement && nextStep.hasAttribute("data-subscription-step")) {
            nextStep.scrollIntoView({ behavior: "smooth", block: "start" })
        }
    }, [selection])

    useEffect(() => {
        const configurator = configuratorRef.current
        const configuratorEnd = configuratorEndRef.current
        if (!configurator || !configuratorEnd) return

        let animationFrame = 0
        const updateViewportState = () => {
            const viewportHeight = window.innerHeight
            const configuratorRect = configurator.getBoundingClientRect()
            const configuratorEndRect = configuratorEnd.getBoundingClientRect()
            const configuratorIsVisible = configuratorRect.top < viewportHeight && configuratorRect.bottom > 0
            const stepElements = Array.from(configurator.querySelectorAll<HTMLElement>("[data-subscription-step]"))
            const activeIndex = stepElements.reduce(
                (closest, step, index) => {
                    const distance = Math.abs(step.getBoundingClientRect().top - viewportHeight * 0.35)
                    return distance < closest.distance ? { index, distance } : closest
                },
                { index: 0, distance: Number.POSITIVE_INFINITY }
            ).index

            setShowBottomBlur(configuratorIsVisible && configuratorEndRect.bottom > viewportHeight)
            setShowStepIndicator(configuratorIsVisible)
            setActiveStepIndex(activeIndex)
        }
        const scheduleUpdate = () => {
            cancelAnimationFrame(animationFrame)
            animationFrame = requestAnimationFrame(updateViewportState)
        }
        const resizeObserver = new ResizeObserver(scheduleUpdate)

        resizeObserver.observe(configurator)
        resizeObserver.observe(configuratorEnd)
        window.addEventListener("resize", scheduleUpdate)
        window.addEventListener("scroll", scheduleUpdate, { passive: true })
        scheduleUpdate()

        return () => {
            cancelAnimationFrame(animationFrame)
            resizeObserver.disconnect()
            window.removeEventListener("resize", scheduleUpdate)
            window.removeEventListener("scroll", scheduleUpdate)
        }
    }, [])

    return (
        <div ref={configuratorRef} className="relative z-10 flex min-w-0 flex-col gap-8 lg:col-span-2 lg:pt-30">
            <div className="space-y-48">
                <div className="space-y-8 scroll-mt-48" data-subscription-step="customerType">
                    <SubscriptionOptionCategoryLabel label={content.customerType.label} description={content.customerType.description} />
                    <div className="grid gap-3">
                        <SubscriptionOptionCard
                            title={content.customerType.b2b.title}
                            description={content.customerType.b2b.description}
                            icon={icons.customerType.b2b}
                            accent={content.customerType.b2b.color}
                            active={selection.customerType === "b2b"}
                            onClick={() => selectOption({ type: "customerTypeChanged", value: "b2b" }, "b2b", "customerType")}
                        />
                        <SubscriptionOptionCard
                            title={content.customerType.b2c.title}
                            description={content.customerType.b2c.description}
                            icon={icons.customerType.b2c}
                            accent={content.customerType.b2c.color}
                            active={selection.customerType === "b2c"}
                            onClick={() => selectOption({ type: "customerTypeChanged", value: "b2c" }, "b2c", "customerType")}
                        />
                    </div>
                </div>

                {selection.customerType === "b2c" && (
                    <div className="space-y-8 scroll-mt-48" data-subscription-step="plan">
                        <SubscriptionOptionCategoryLabel label={content.plan.title} description={content.plan.description} />
                        <div className="grid gap-3">
                            <SubscriptionOptionCard
                                title={content.plan.pro.title}
                                description={content.plan.pro.description}
                                icon={icons.plan.pro}
                                accent="brand"
                                active={selection.plan === "pro"}
                                onClick={() => selectOption({ type: "planChanged", value: "pro" }, "pro", "plan")}
                            />
                            <SubscriptionOptionCard
                                title={content.plan.max.title}
                                description={content.plan.max.description}
                                icon={icons.plan.max}
                                accent="magenta"
                                active={selection.plan === "max"}
                                onClick={() => selectOption({ type: "planChanged", value: "max" }, "max", "plan")}
                            />
                            <SubscriptionOptionCard
                                title={content.plan.custom.title}
                                description={content.plan.custom.description}
                                icon={icons.plan.custom}
                                accent="aqua"
                                active={selection.plan === "custom"}
                                onClick={() => selectOption({ type: "planChanged", value: "custom" }, "custom", "plan")}
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-8 scroll-mt-48" data-subscription-step="deployment">
                    <SubscriptionOptionCategoryLabel label={content.deployment.label} description={content.deployment.description} />
                    <div className="grid gap-3">
                        <SubscriptionOptionCard
                            title={content.deployment.selfHosted.title}
                            description={content.deployment.selfHosted.description}
                            icon={icons.deployment.selfHosted}
                            accent={content.deployment.selfHosted.color}
                            active={selection.deployment === "self_hosted"}
                            onClick={() => selectOption({ type: "deploymentChanged", value: "self_hosted" }, "selfHosted", "deployment")}
                        />
                        <SubscriptionOptionCard
                            title={content.deployment.cloud.title}
                            description={content.deployment.cloud.description}
                            icon={icons.deployment.cloud}
                            accent={content.deployment.cloud.color}
                            active={selection.deployment === "cloud"}
                            onClick={() => selectOption({ type: "deploymentChanged", value: "cloud" }, "cloud", "deployment")}
                        />
                    </div>
                </div>

                {selection.plan === "custom" && (
                    <div className="space-y-8 scroll-mt-48" data-subscription-step="aiTokens">
                        <SubscriptionOptionCategoryLabel label={aiTokens.title} description={aiTokens.description} />
                        <Slider
                            min={aiTokenRange.min}
                            max={aiTokenRange.max}
                            step={aiTokenRange.step}
                            value={selection.aiTokens}
                            onChange={(aiTokensValue) => dispatch({ type: "aiTokensChanged", value: aiTokensValue })}
                            ariaLabel={aiTokens.title}
                            className="rounded-2xl border border-white/10 p-4"
                            valueLabelSuffix={aiTokens.suffix}
                            centerLabelSuffix={paymentPeriodSuffix}
                        />
                    </div>
                )}

                {selection.plan === "custom" && (
                    <div className="space-y-8 scroll-mt-48" data-subscription-step="workflowExecutions">
                        <SubscriptionOptionCategoryLabel label={workflowExecutions.title} description={workflowExecutions.description} />
                        <Slider
                            min={workflowExecutionRange.min}
                            max={workflowExecutionRange.max}
                            step={workflowExecutionRange.step}
                            value={selection.workflowExecutions}
                            onChange={(workflowExecutionsValue) => dispatch({ type: "workflowExecutionsChanged", value: workflowExecutionsValue })}
                            ariaLabel={workflowExecutions.title}
                            className="rounded-2xl border border-white/10 p-4"
                            valueLabelSuffix={workflowExecutions.suffix}
                            centerLabelSuffix={paymentPeriodSuffix}
                        />
                        <div className="flex w-full items-center justify-between gap-4">
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
                                onApply={(workflowExecutionsValue) => dispatch({ type: "workflowExecutionsChanged", value: workflowExecutionsValue })}
                            />
                            <div className="flex flex-wrap items-start justify-end gap-2">
                                <p className="text-sm font-medium text-tertiary">{content.contactSales.prompt}</p>
                                <LinkButton href={content.contactSales.href} className="border-b-0 py-0 text-sm text-secondary" showArrow={false}>
                                    {content.contactSales.label}
                                </LinkButton>
                            </div>
                        </div>
                    </div>
                )}

                {selection.plan === "custom" && content.additionalFeatures && content.additionalFeatures.length > 0 && (
                    <div className="space-y-8 scroll-mt-48" data-subscription-step="additionalFeatures">
                        <SubscriptionOptionCategoryLabel label={content.additionalFeaturesLabel ?? "Additional Features"} description={content.additionalFeaturesDescription} />
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
                                        active={Boolean(feature.id && selectedFeatureIds.has(feature.id))}
                                        onClick={feature.id ? () => dispatch({ type: "additionalFeatureToggled", id: feature.id! }) : undefined}
                                    />
                                )
                            })}
                        </div>
                    </div>
                )}

                <div className="space-y-8 scroll-mt-48" data-subscription-step="paymentPeriod">
                    <SubscriptionOptionCategoryLabel label={content.paymentPeriod.label} description={content.paymentPeriod.description} />
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
                                    onClick={() => dispatch({ type: "paymentPeriodChanged", value: period })}
                                />
                            )
                        })}
                    </div>
                </div>
            </div>

            <div ref={configuratorEndRef}>
                <div className="mb-3 flex min-w-0 items-baseline justify-end gap-2 text-right">
                    <NumberFlow
                        value={monthlyPrice}
                        locales={locale === "de" ? "de-DE" : "en-US"}
                        format={{ style: "currency", currency: "EUR", trailingZeroDisplay: "stripIfInteger" }}
                        className="text-2xl font-semibold text-brand"
                    />
                    <span className="max-w-28 truncate text-base text-tertiary">{monthlyPeriodSuffix}</span>
                </div>
                <HapticButtonLink href={subscribeHref} variant="filled" className="h-10! w-full! bg-white/80! font-semibold! text-primary! hover:bg-white!">
                    {content.subscribe.label}
                </HapticButtonLink>
            </div>

            <nav
                aria-label="Configuration progress"
                className={cn(
                    "fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-center gap-2 transition-opacity duration-200 lg:flex",
                    showStepIndicator ? "opacity-100" : "pointer-events-none opacity-0"
                )}
            >
                {configuratorSteps.map((step, index) => (
                    <button
                        key={`${step}-${index}`}
                        type="button"
                        aria-label={step.replaceAll("**", "")}
                        onClick={() => configuratorRef.current?.querySelectorAll<HTMLElement>("[data-subscription-step]").item(index)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                        className={cn(
                            "block rounded-full transition-all duration-200 hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                            index === activeStepIndex ? "h-4 w-1.5 bg-white/80" : "size-1.5 bg-white/20"
                        )}
                    />
                ))}
            </nav>

            <div
                aria-hidden="true"
                className={cn(
                    "pointer-events-none fixed inset-x-0 bottom-0 z-40 h-56 bg-linear-to-t from-primary via-primary/50 to-transparent backdrop-blur-[2px] mask-[linear-gradient(to_top,black_0%,black_30%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_top,black_0%,black_30%,transparent_100%)] transition-opacity duration-200",
                    showBottomBlur ? "opacity-100" : "opacity-0"
                )}
            />
        </div>
    )
}
