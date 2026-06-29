"use client"

import type { SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { useDesktopPinnedPosition } from "@/hooks/useDesktopPinnedPosition"
import { cn } from "@/lib/utils"
import { BuyMenu } from "@/components/BuyMenu"
import { Slider } from "@/components/ui/Slider"
import { IconCheck } from "@tabler/icons-react"
import type { ReactNode } from "react"
import { useState } from "react"
import { LinkButton } from "./ui/LinkButton"
import { Card } from "./ui/Card"

type DeploymentMode = "self-hosted" | "cloud"
type CustomerType = "b2b" | "b2c"
type OptionAccent = "aqua" | "yellow" | "pink" | "blue" | "brand"
type SubscriptionSelection = {
    deployment: DeploymentMode
    customerType: CustomerType
    workflowExecutions: number
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
    additionalFeatures: ReactNode[]
}

const defaultContent: Omit<SubscriptionConfigData, "id" | "title"> = {
    pageIntro: {
        heading: "Configure your setup before you talk pricing.",
        description: "Pick your operating model, customer shape, and usage pattern. The right-hand side updates into a purchase-ready configuration flow instead of a generic pricing table.",
    },
    featureOverview: [
        {
            title: "Fast onboarding",
            description: "Move from evaluation to a concrete subscription path without guessing which packaging model fits your rollout.",
            icon: "rocket",
        },
        {
            title: "Commercial clarity",
            description: "Separate customer type, hosting model, and runtime expectations before a plan is proposed.",
            icon: "user-shield",
        },
        {
            title: "Usage visibility",
            description: "Shape your quote around expected workflow execution volume instead of a generic flat plan.",
            icon: "gauge",
        },
    ],
    optionsPanelHeading: "Build the subscription shape",
    deployment: {
        label: "Deployment",
        selfHosted: {
            title: "Self-hosted",
            description: "Deploy on your own infrastructure with full operational control.",
            icon: "server",
            color: "yellow",
        },
        cloud: {
            title: "Cloud",
            description: "Use managed infrastructure with selectable runtime consumption.",
            icon: "cloud",
            color: "aqua",
        },
    },
    customerType: {
        label: "Customer Type",
        b2b: {
            title: "B2B",
            description: "Organization purchase flow with tailored commercial handling.",
            icon: "briefcase-2",
            color: "blue",
        },
        b2c: {
            title: "B2C",
            description: "Standardized subscription flow with directly selectable plans.",
            icon: "building-store",
            color: "pink",
        },
    },
    workflowExecutions: {
        title: "Workflow Executions",
        description: "How many workflow executions do you expect per month?",
        min: 200,
        max: 10000,
        step: 100,
        minLabel: "200 exec",
        maxLabel: "10,000 exec",
        centerSuffix: "exec",
    },
    contactSales: {
        prompt: "Need more?",
        label: "Contact sales",
        href: "/contact",
    },
    subscribe: {
        label: "Buy now",
        baseUrl: "",
    },
    price: {
        heading: "Price",
        caption: "per month",
    },
}

const optionAccentStyles: Record<
    OptionAccent,
    {
        activeBorder: string
        activeBackground: string
        activeRing: string
        activeGlow: string
        activeIcon: string
    }
> = {
    aqua: {
        activeBorder: "border-aqua/60",
        activeBackground: "from-aqua/14 via-white/[0.04] to-transparent",
        activeRing: "ring-aqua/25",
        activeGlow: "bg-[radial-gradient(circle_at_top_right,rgba(114,201,248,0.16),transparent_38%)]",
        activeIcon: "text-aqua",
    },
    yellow: {
        activeBorder: "border-yellow/60",
        activeBackground: "from-yellow/14 via-white/[0.04] to-transparent",
        activeRing: "ring-yellow/25",
        activeGlow: "bg-[radial-gradient(circle_at_top_right,rgba(248,241,114,0.16),transparent_38%)]",
        activeIcon: "text-yellow",
    },
    pink: {
        activeBorder: "border-pink/60",
        activeBackground: "from-pink/14 via-white/[0.04] to-transparent",
        activeRing: "ring-pink/25",
        activeGlow: "bg-[radial-gradient(circle_at_top_right,rgba(248,114,226,0.16),transparent_38%)]",
        activeIcon: "text-pink",
    },
    blue: {
        activeBorder: "border-blue/60",
        activeBackground: "from-blue/14 via-white/[0.04] to-transparent",
        activeRing: "ring-blue/25",
        activeGlow: "bg-[radial-gradient(circle_at_top_right,rgba(114,169,248,0.16),transparent_38%)]",
        activeIcon: "text-blue",
    },
    brand: {
        activeBorder: "border-brand/60",
        activeBackground: "from-brand/14 via-white/[0.04] to-transparent",
        activeRing: "ring-brand/25",
        activeGlow: "bg-[radial-gradient(circle_at_top_right,rgba(114,248,150,0.16),transparent_38%)]",
        activeIcon: "text-brand",
    },
}

function OptionCard({
    title,
    description,
    active,
    onClick,
    icon,
    disabled = false,
    accent = "aqua",
}: {
    title: string
    description: string
    active: boolean
    onClick?: () => void
    icon: ReactNode
    disabled?: boolean
    accent?: OptionAccent
}) {
    const accentStyles = optionAccentStyles[accent]

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300",
                disabled ? "cursor-not-allowed border-white/10 opacity-45" : "border-white/10 hover:bg-white/5",
                active && cn("bg-linear-to-br ring-1", accentStyles.activeBorder, accentStyles.activeBackground, accentStyles.activeRing)
            )}
        >
            <div className="relative z-10 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <div className="relative inline-flex shrink-0 items-center justify-center">
                        {active ? (
                            <div
                                aria-hidden="true"
                                className={cn("pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl", accentStyles.activeGlow)}
                            />
                        ) : null}
                        <div className={cn("relative inline-flex items-center justify-center text-secondary [&>svg]:h-[1.05em] [&>svg]:w-[1.05em]", active && accentStyles.activeIcon)}>{icon}</div>
                    </div>
                    <p className="text-base font-semibold text-white">{title}</p>
                </div>
                <p className="text-sm leading-6 text-secondary">{description}</p>
            </div>
        </button>
    )
}

function FeatureRow({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
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

function AdditionalFeatureCard({
    title,
    description,
    active,
    onClick,
    icon,
    formattedPrice,
}: {
    title: string
    description: string
    active: boolean
    onClick?: () => void
    icon: ReactNode
    formattedPrice: string
}) {
    const accentStyles = optionAccentStyles["brand"]

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300",
                "border-white/10 hover:bg-white/5",
                active && cn("bg-linear-to-br ring-1", accentStyles.activeBorder, accentStyles.activeBackground, accentStyles.activeRing)
            )}
        >
            <div className="relative z-10 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <div className="relative inline-flex shrink-0 items-center justify-center">
                        {active ? (
                            <div
                                aria-hidden="true"
                                className={cn("pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl", accentStyles.activeGlow)}
                            />
                        ) : null}
                        <div className={cn("relative inline-flex items-center justify-center text-secondary [&>svg]:h-[1.05em] [&>svg]:w-[1.05em]", active && accentStyles.activeIcon)}>{icon}</div>
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

export function SubscriptionConfigurator({ locale, content, icons }: { locale: AppLocale; content?: SubscriptionConfigData | null; icons: SubscriptionIcons }) {
    const resolved = content ?? ({ id: 0, title: "Subscription Config", ...defaultContent } satisfies SubscriptionConfigData)
    const workflowExecutions = resolved.workflowExecutions
    const [selection, setSelection] = useState<SubscriptionSelection>({
        deployment: "self-hosted",
        customerType: "b2b",
        workflowExecutions: 1000,
    })
    const [selectedFeatures, setSelectedFeatures] = useState<Set<number>>(new Set())
    const desktopTopOffset = 96
    const { wrapperRef: desktopWrapperRef, containerRef: desktopContainerRef } = useDesktopPinnedPosition<HTMLDivElement, HTMLDivElement>(desktopTopOffset)

    const workflowExecutionPrice = 0.001 * selection.workflowExecutions
    const additionalFeaturesPrice = Array.from(selectedFeatures).reduce((acc, idx) => acc + (resolved.additionalFeatures?.[idx]?.price ?? 0), 0)
    const totalPrice = new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2,
    }).format(workflowExecutionPrice + additionalFeaturesPrice)

    const subscribeHref = (() => {
        const searchParams = new URLSearchParams({
            deployment: selection.deployment,
            customerType: selection.customerType,
            workflowExecutions: String(selection.workflowExecutions),
        })

        if (selectedFeatures.size > 0 && resolved.additionalFeatures) {
            const featureIds = Array.from(selectedFeatures)
                .map((idx) => resolved.additionalFeatures![idx]?.id ?? String(idx))
                .join(",")
            searchParams.set("additionalFeatures", featureIds)
        }

        return `${resolved.subscribe.baseUrl}?${searchParams.toString()}`
    })()

    return (
        <>
            <div className="grid gap-8 lg:grid-cols-5">
                <section ref={desktopWrapperRef} className="relative min-w-0 lg:col-span-2">
                    <div
                        ref={desktopContainerRef}
                        className="relative z-10 flex min-w-0 flex-col gap-12"
                    >
                        <div className="max-w-2xl">
                            <h1 className="mt-4 max-w-xl text-balance text-3xl font-semibold text-white lg:text-4xl">{resolved.pageIntro.heading}</h1>
                            <p className="mt-4 max-w-xl text-base leading-7 text-secondary lg:text-lg">{resolved.pageIntro.description}</p>
                        </div>

                        <div className="grid gap-6">
                            {resolved.featureOverview.map((item, index) => (
                                <FeatureRow key={item.id ?? `${item.title}-${index}`} icon={icons.featureOverview[index]} title={item.title} description={item.description} />
                            ))}
                        </div>
                    </div>
                </section>

                <Card size="lg" className="lg:col-span-3 relative min-w-0 overflow-hidden p-6 bg-primary/50">
                    <div className="relative z-10 flex flex-col gap-8">
                        <h2 className="text-2xl font-semibold text-white lg:text-3xl">{resolved.optionsPanelHeading}</h2>

                        <div className="space-y-2">
                            <p className="text-base text-secondary">{resolved.deployment.label}</p>
                            <div className="grid gap-3 md:grid-cols-2">
                                <OptionCard
                                    title={resolved.deployment.selfHosted.title}
                                    description={resolved.deployment.selfHosted.description}
                                    icon={icons.deployment.selfHosted}
                                    accent={resolved.deployment.selfHosted.color}
                                    active={selection.deployment === "self-hosted"}
                                    onClick={() => setSelection((current) => ({ ...current, deployment: "self-hosted" }))}
                                />
                                <OptionCard
                                    title={resolved.deployment.cloud.title}
                                    description={resolved.deployment.cloud.description}
                                    icon={icons.deployment.cloud}
                                    accent={resolved.deployment.cloud.color}
                                    active={selection.deployment === "cloud"}
                                    onClick={() => setSelection((current) => ({ ...current, deployment: "cloud" }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-base text-secondary">{resolved.customerType.label}</p>
                            <div className="grid gap-3 md:grid-cols-2">
                                <OptionCard
                                    title={resolved.customerType.b2b.title}
                                    description={resolved.customerType.b2b.description}
                                    icon={icons.customerType.b2b}
                                    accent={resolved.customerType.b2b.color}
                                    active={selection.customerType === "b2b"}
                                    onClick={() => setSelection((current) => ({ ...current, customerType: "b2b" }))}
                                />
                                <OptionCard
                                    title={resolved.customerType.b2c.title}
                                    description={resolved.customerType.b2c.description}
                                    icon={icons.customerType.b2c}
                                    accent={resolved.customerType.b2c.color}
                                    active={selection.customerType === "b2c"}
                                    onClick={() => setSelection((current) => ({ ...current, customerType: "b2c" }))}
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-lg font-semibold tracking-wider text-white">{workflowExecutions.title}</p>
                                    <p className="text-sm text-secondary">{workflowExecutions.description}</p>
                                </div>
                            </div>
                            <Slider
                                min={workflowExecutions.min}
                                max={workflowExecutions.max}
                                step={workflowExecutions.step}
                                value={selection.workflowExecutions}
                                onChange={(workflowExecutionsValue) => setSelection((current) => ({ ...current, workflowExecutions: workflowExecutionsValue }))}
                                ariaLabel={workflowExecutions.title}
                                className="mt-4"
                                minLabel={workflowExecutions.minLabel}
                                centerLabel={`${selection.workflowExecutions} ${workflowExecutions.centerSuffix}`}
                                maxLabel={workflowExecutions.maxLabel}
                            />
                            <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                                <p className="text-sm font-medium text-tertiary">{resolved.contactSales.prompt}</p>
                                <LinkButton href={resolved.contactSales.href} className="border-b-0 text-secondary" showArrow={false}>
                                    {resolved.contactSales.label}
                                </LinkButton>
                            </div>
                        </div>

                        {resolved.additionalFeatures && resolved.additionalFeatures.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-base text-secondary">{resolved.additionalFeaturesLabel ?? "Additional Features"}</p>
                                <div className="grid gap-3">
                                    {resolved.additionalFeatures.map((feature, index) => {
                                        const formattedFeaturePrice = new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", {
                                            style: "currency",
                                            currency: "EUR",
                                            maximumFractionDigits: 2,
                                        }).format(feature.price)
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
            <BuyMenu price={totalPrice} priceHeading={resolved.price.heading} priceCaption={resolved.price.caption} subscribeHref={subscribeHref} subscribeLabel={resolved.subscribe.label} />
        </>
    )
}
