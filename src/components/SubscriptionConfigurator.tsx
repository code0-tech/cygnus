"use client"

import type { SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { getTablerIcon } from "@/lib/tablerIcons"
import { cn } from "@/lib/utils"
import { HapticButtonLink } from "@/components/ui/HapticButtonLink"
import { Slider } from "@/components/ui/Slider"
import { SegmentedControl, SegmentedControlItem } from "@code0-tech/pictor"
import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"

type DeploymentMode = "self-hosted" | "cloud"
type CustomerType = "b2b" | "b2c"
type SubscriptionTier = "pro" | "team"
type RuntimeMode = "monthly" | "payg"
type OptionAccent = "aqua" | "yellow" | "pink" | "blue" | "brand"
type SubscriptionSelection = {
    deployment: DeploymentMode
    customerType: CustomerType
    subscriptionTier: SubscriptionTier
    teamSeats: number
    runtimeMode: RuntimeMode
    runtimeMinutes: number
}

const defaultContent: Omit<SubscriptionConfigData, "id" | "title"> = {
    pageIntro: {
        heading: "Configure your setup before you talk pricing.",
        description:
            "Pick your operating model, customer shape, and usage pattern. The right-hand side updates into a purchase-ready configuration flow instead of a generic pricing table.",
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
            description: "Cloud deployments can be framed around monthly runtime needs or a pay-as-you-go usage model.",
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
    subscriptionTier: {
        label: "Subscription tier",
        pro: {
            title: "PRO",
            description: "Single-owner setup for advanced personal or expert workflows.",
            icon: "sparkles",
            color: "brand",
        },
        team: {
            title: "TEAM",
            description: "Shared workspace model with seat-based team access.",
            icon: "users-group",
            color: "aqua",
        },
    },
    teamSeats: {
        title: "Seats",
        description: "How many user seats do you need?",
        min: 2,
        max: 250,
        step: 1,
        minLabel: "2 seats",
        maxLabel: "250 seats",
        centerSuffix: "seats",
    },
    runtime: {
        title: "Runtime",
        description: "Select monthly runtime minutes or switch to pay-as-you-go consumption.",
        monthlyLabel: "Monthly",
        paygLabel: "Pay as you go",
        paygDescription: "Usage is billed based on actual cloud runtime consumption instead of a fixed monthly minute pack.",
        min: 200,
        max: 10000,
        step: 100,
        minLabel: "200 min",
        maxLabel: "10,000 min",
        centerSuffix: "min",
    },
    subscribe: {
        label: "Subscribe",
        baseUrl: "",
    },
    price: {
        heading: "Price",
        caption: "per month",
    },
}

const optionAccentStyles: Record<OptionAccent, {
    activeBorder: string
    activeBackground: string
    activeRing: string
    activeGlow: string
    activeIcon: string
}> = {
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
                "shadow-[0_18px_48px_rgba(0,0,0,0.22)]",
                disabled
                    ? "cursor-not-allowed border-white/8 opacity-45"
                    : "border-white/10 hover:border-white/20 hover:bg-white/5",
                active && cn("bg-linear-to-br ring-1", accentStyles.activeBorder, accentStyles.activeBackground, accentStyles.activeRing),
            )}
        >
            <div className="relative z-10 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <div className="relative inline-flex shrink-0 items-center justify-center">
                        {active ? (
                            <div
                                aria-hidden="true"
                                className={cn(
                                    "pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl",
                                    accentStyles.activeGlow,
                                )}
                            />
                        ) : null}
                        <div
                            className={cn(
                                "relative inline-flex items-center justify-center text-white/80 [&>svg]:h-[1.05em] [&>svg]:w-[1.05em]",
                                active && accentStyles.activeIcon,
                            )}
                        >
                            {icon}
                        </div>
                    </div>
                    <p className="text-base font-semibold text-white">{title}</p>
                </div>
                <p className="text-sm leading-6 text-white/75">{description}</p>
            </div>
        </button>
    )
}

function FeatureRow({ icon, title, description }: { icon: ReactNode, title: string, description: string }) {
    return (
        <div className="rounded-3xl border border-white/8 bg-white/5 p-4">
            <div className="flex items-center gap-2">
                <div className="inline-flex shrink-0 items-center justify-center text-yellow [&>svg]:h-[1.05em] [&>svg]:w-[1.05em]">
                    {icon}
                </div>
                <p className="text-base font-semibold tracking-wider text-white">{title}</p>
            </div>
            <p className="mt-2 text-sm text-white/68">{description}</p>
        </div>
    )
}

export function SubscriptionConfigurator({ locale, content }: { locale: AppLocale, content?: SubscriptionConfigData | null }) {
    const resolved = content ?? ({ id: 0, title: "Subscription Config", ...defaultContent } satisfies SubscriptionConfigData)
    const [selection, setSelection] = useState<SubscriptionSelection>({
        deployment: "self-hosted",
        customerType: "b2b",
        subscriptionTier: "pro",
        teamSeats: 12,
        runtimeMode: "monthly",
        runtimeMinutes: 2400,
    })
    const desktopTopOffset = 96
    const [desktopMode, setDesktopMode] = useState<"static" | "fixed" | "bottom">("static")
    const [desktopStyle, setDesktopStyle] = useState<{ left: number, width: number, top: number } | null>(null)
    const desktopWrapperRef = useRef<HTMLDivElement>(null)
    const desktopContainerRef = useRef<HTMLDivElement>(null)
    const seatCount = selection.customerType === "b2b"
        ? selection.teamSeats
        : selection.subscriptionTier === "team"
            ? selection.teamSeats
            : 1
    const seatPrice = selection.customerType === "b2b"
        ? seatCount * (25 + (150 / (seatCount ** 1.2)))
        : seatCount * (3.99 + (5 / (seatCount ** 1.2)))
    const runtimePrice = selection.deployment === "cloud" && selection.runtimeMode === "monthly"
        ? 0.001 * selection.runtimeMinutes
        : 0
    const totalPrice = seatPrice + runtimePrice
    const formattedSeatPrice = new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2,
    }).format(totalPrice)

    const subscribeHref = (() => {
        const searchParams = new URLSearchParams({
            deployment: selection.deployment,
            customerType: selection.customerType,
        })

        if (selection.customerType === "b2c") {
            searchParams.set("subscriptionTier", selection.subscriptionTier)
        }

        if (selection.customerType === "b2c" && selection.subscriptionTier === "team") {
            searchParams.set("teamSeats", String(selection.teamSeats))
        }

        if (selection.deployment === "cloud") {
            searchParams.set("runtimeMode", selection.runtimeMode)
            if (selection.runtimeMode === "monthly") {
                searchParams.set("runtimeMinutes", String(selection.runtimeMinutes))
            }
        }

        return `${resolved.subscribe.baseUrl}?${searchParams.toString()}`
    })()

    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 1023px)")

        const updateDesktopPosition = () => {
            if (mediaQuery.matches) {
                setDesktopMode("static")
                setDesktopStyle(null)
                return
            }

            const wrapper = desktopWrapperRef.current
            const container = desktopContainerRef.current
            if (!wrapper || !container) return

            const wrapperRect = wrapper.getBoundingClientRect()
            const containerHeight = container.offsetHeight
            const wrapperHeight = wrapper.offsetHeight
            const maxTop = Math.max(wrapperHeight - containerHeight, 0)
            const wrapperTop = window.scrollY + wrapperRect.top
            const fixedTop = window.scrollY + desktopTopOffset

            const nextMode =
                fixedTop <= wrapperTop
                    ? "static"
                    : fixedTop >= wrapperTop + maxTop
                        ? "bottom"
                        : "fixed"

            setDesktopMode((prev) => (prev === nextMode ? prev : nextMode))
            setDesktopStyle((prev) => (
                prev?.left === wrapperRect.left && prev?.width === wrapperRect.width && prev?.top === maxTop
                    ? prev
                    : { left: wrapperRect.left, width: wrapperRect.width, top: maxTop }
            ))
        }

        updateDesktopPosition()

        const resizeObserver = new ResizeObserver(updateDesktopPosition)
        const wrapper = desktopWrapperRef.current
        const container = desktopContainerRef.current
        if (wrapper) resizeObserver.observe(wrapper)
        if (container) resizeObserver.observe(container)

        window.addEventListener("scroll", updateDesktopPosition, { passive: true })
        window.addEventListener("resize", updateDesktopPosition)
        mediaQuery.addEventListener("change", updateDesktopPosition)

        return () => {
            resizeObserver.disconnect()
            window.removeEventListener("scroll", updateDesktopPosition)
            window.removeEventListener("resize", updateDesktopPosition)
            mediaQuery.removeEventListener("change", updateDesktopPosition)
        }
    }, [])

    return (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.85fr)]">
            <section ref={desktopWrapperRef} className="relative min-w-0">
                <div
                    ref={desktopContainerRef}
                    className={cn(
                        "relative z-10 flex min-w-0 flex-col gap-8",
                        desktopMode === "fixed" && "fixed z-30",
                        desktopMode === "bottom" && "absolute left-0 right-0",
                    )}
                    style={
                        desktopMode === "fixed" && desktopStyle
                            ? {
                                top: `${desktopTopOffset}px`,
                                left: `${desktopStyle.left}px`,
                                width: `${desktopStyle.width}px`,
                            }
                            : desktopMode === "bottom" && desktopStyle
                                ? { top: `${desktopStyle.top}px` }
                                : undefined
                    }
                >
                    <div className="max-w-2xl">
                        <h1 className="mt-4 max-w-xl text-balance text-3xl font-semibold text-white lg:text-4xl">
                            {resolved.pageIntro.heading}
                        </h1>
                        <p className="mt-4 max-w-xl text-base leading-7 text-white/75 lg:text-lg">
                            {resolved.pageIntro.description}
                        </p>
                    </div>

                    <div className="grid gap-4">
                        {resolved.featureOverview.map((item, index) => (
                            <FeatureRow
                                key={item.id ?? `${item.title}-${index}`}
                                icon={getTablerIcon(item.icon, 20)}
                                title={item.title}
                                description={item.description}
                            />
                        ))}
                    </div>
                </div>
            </section>

            <section className="glass-card-shell relative min-w-0 overflow-hidden rounded-3xl p-6">
                <div aria-hidden="true" className="glass-card-topline" />
                <div className="relative z-10 flex flex-col gap-8">
                    <h2 className="text-2xl font-semibold text-white lg:text-3xl">{resolved.optionsPanelHeading}</h2>

                    <div className="space-y-4">
                        <p className="text-lg font-semibold tracking-wider text-white/50">{resolved.deployment.label}</p>
                        <div className="grid gap-3 md:grid-cols-2">
                            <OptionCard
                                title={resolved.deployment.selfHosted.title}
                                description={resolved.deployment.selfHosted.description}
                                icon={getTablerIcon(resolved.deployment.selfHosted.icon, 20)}
                                accent={resolved.deployment.selfHosted.color}
                                active={selection.deployment === "self-hosted"}
                                onClick={() => setSelection((current) => ({ ...current, deployment: "self-hosted" }))}
                            />
                            <OptionCard
                                title={resolved.deployment.cloud.title}
                                description={resolved.deployment.cloud.description}
                                icon={getTablerIcon(resolved.deployment.cloud.icon, 20)}
                                accent={resolved.deployment.cloud.color}
                                active={selection.deployment === "cloud"}
                                onClick={() => setSelection((current) => ({ ...current, deployment: "cloud" }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-lg font-semibold tracking-wider text-white/50">{resolved.customerType.label}</p>
                        <div className="grid gap-3 md:grid-cols-2">
                            <OptionCard
                                title={resolved.customerType.b2b.title}
                                description={resolved.customerType.b2b.description}
                                icon={getTablerIcon(resolved.customerType.b2b.icon, 20)}
                                accent={resolved.customerType.b2b.color}
                                active={selection.customerType === "b2b"}
                                onClick={() => setSelection((current) => ({ ...current, customerType: "b2b" }))}
                            />
                            <OptionCard
                                title={resolved.customerType.b2c.title}
                                description={resolved.customerType.b2c.description}
                                icon={getTablerIcon(resolved.customerType.b2c.icon, 20)}
                                accent={resolved.customerType.b2c.color}
                                active={selection.customerType === "b2c"}
                                onClick={() => setSelection((current) => ({ ...current, customerType: "b2c" }))}
                            />
                        </div>
                    </div>

                    {selection.customerType === "b2c" &&
                        <div className="space-y-4">
                            <p className="text-lg font-semibold tracking-wider text-white/50">{resolved.subscriptionTier.label}</p>
                            <div className="grid gap-3 md:grid-cols-2">
                                <OptionCard
                                    title={resolved.subscriptionTier.pro.title}
                                    description={resolved.subscriptionTier.pro.description}
                                    icon={getTablerIcon(resolved.subscriptionTier.pro.icon, 20)}
                                    accent={resolved.subscriptionTier.pro.color}
                                    active={selection.subscriptionTier === "pro"}
                                    onClick={() => setSelection((current) => ({ ...current, subscriptionTier: "pro" }))}
                                />
                                <OptionCard
                                    title={resolved.subscriptionTier.team.title}
                                    description={resolved.subscriptionTier.team.description}
                                    icon={getTablerIcon(resolved.subscriptionTier.team.icon, 20)}
                                    accent={resolved.subscriptionTier.team.color}
                                    active={selection.subscriptionTier === "team"}
                                    onClick={() => setSelection((current) => ({ ...current, subscriptionTier: "team" }))}
                                />
                            </div>
                        </div>
                    }

                    {(selection.customerType === "b2b" || (selection.customerType === "b2c" && selection.subscriptionTier === "team")) &&
                        <div className="rounded-2xl border border-white/10 p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-lg font-semibold tracking-wider text-white">{resolved.teamSeats.title}</p>
                                    <p className="text-sm text-white/75">{resolved.teamSeats.description}</p>
                                </div>
                            </div>
                            <Slider
                                min={resolved.teamSeats.min}
                                max={resolved.teamSeats.max}
                                step={resolved.teamSeats.step}
                                value={selection.teamSeats}
                                onChange={(teamSeats) => setSelection((current) => ({ ...current, teamSeats }))}
                                className="mt-4"
                                minLabel={resolved.teamSeats.minLabel}
                                centerLabel={`${selection.teamSeats} ${resolved.teamSeats.centerSuffix}`}
                                maxLabel={resolved.teamSeats.maxLabel}
                            />
                        </div>
                    }

                    {selection.deployment === "cloud" &&
                        <div className="rounded-2xl border border-white/10 p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-lg font-semibold tracking-wider text-white">{resolved.runtime.title}</p>
                                    <p className="mt-2 text-sm text-white/75">
                                        {resolved.runtime.description}
                                    </p>
                                </div>
                                <SegmentedControl
                                    type="single"
                                    value={selection.runtimeMode}
                                    onValueChange={(value) => {
                                        if (value) {
                                            setSelection((current) => ({ ...current, runtimeMode: value as RuntimeMode }))
                                        }
                                    }}
                                    className="h-11! rounded-2xl! border-white/10! bg-black/20! p-1!"
                                >
                                    <SegmentedControlItem
                                        value="monthly"
                                        className="px-3! py-2! text-xs! font-medium! text-white/60! transition-colors! data-[state=on]:bg-white! data-[state=on]:text-primary!"
                                    >
                                        {resolved.runtime.monthlyLabel}
                                    </SegmentedControlItem>
                                    <SegmentedControlItem
                                        value="payg"
                                        className="w-max! px-3! py-2! text-xs! font-medium! text-white/60! transition-colors! data-[state=on]:bg-white! data-[state=on]:text-primary!"
                                    >
                                        {resolved.runtime.paygLabel}
                                    </SegmentedControlItem>
                                </SegmentedControl>
                            </div>

                            {selection.runtimeMode === "monthly" ? (
                                <>
                                <Slider
                                    min={resolved.runtime.min}
                                    max={resolved.runtime.max}
                                    step={resolved.runtime.step}
                                    value={selection.runtimeMinutes}
                                    onChange={(runtimeMinutes) => setSelection((current) => ({ ...current, runtimeMinutes }))}
                                    className="mt-2"
                                    minLabel={resolved.runtime.minLabel}
                                    maxLabel={resolved.runtime.maxLabel}
                                    centerLabel={`${selection.runtimeMinutes} ${resolved.runtime.centerSuffix}`}
                                />
                                </>
                            ) : (
                                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/75">
                                    {resolved.runtime.paygDescription}
                                </div>
                            )}
                        </div>
                    }

                    <div className="rounded-2xl border border-white/10 bg-white/5">
                        <div className="flex items-end gap-2 p-4">
                            <div>
                                <p className="text-sm font-semibold tracking-wider text-white/75">{resolved.price.heading}</p>
                                <p className="mt-3 text-3xl font-semibold text-brand tabular-nums">{formattedSeatPrice}</p>
                            </div>
                            <p className="text-sm text-white/55">{resolved.price.caption}</p>
                        </div>
                        <HapticButtonLink
                            href={subscribeHref}
                            locale={locale}
                            variant="filled"
                            className="mt-2 bg-white/80! px-8! text-primary! hover:bg-white! rounded-t-none!"
                        >
                            {resolved.subscribe.label}
                        </HapticButtonLink>
                    </div>
                </div>
            </section>
        </div>
    )
}
