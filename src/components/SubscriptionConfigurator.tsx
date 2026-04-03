"use client"

import { cn } from "@/lib/utils"
import {
    IconBriefcase2,
    IconBuildingStore,
    IconCloud,
    IconDatabase,
    IconGauge,
    IconRocket,
    IconServer,
    IconSparkles,
    IconUsersGroup,
    IconUserShield,
} from "@tabler/icons-react"
import { useState } from "react"

type DeploymentMode = "self-hosted" | "cloud"
type CustomerType = "b2b" | "b2c"
type SubscriptionTier = "pro" | "team"
type RuntimeMode = "monthly" | "payg"
type OptionAccent = "aqua" | "yellow" | "pink" | "blue" | "brand"

const optionAccentStyles: Record<OptionAccent, {
    activeBorder: string
    activeBackground: string
    activeRing: string
    activeGlow: string
    activeDot: string
}> = {
    aqua: {
        activeBorder: "border-aqua/60",
        activeBackground: "from-aqua/14 via-white/[0.04] to-transparent",
        activeRing: "ring-aqua/25",
        activeGlow: "bg-[radial-gradient(circle_at_top_right,rgba(114,201,248,0.16),transparent_38%)]",
        activeDot: "border-aqua bg-aqua shadow-[0_0_0_4px_rgba(114,201,248,0.14)]",
    },
    yellow: {
        activeBorder: "border-yellow/60",
        activeBackground: "from-yellow/14 via-white/[0.04] to-transparent",
        activeRing: "ring-yellow/25",
        activeGlow: "bg-[radial-gradient(circle_at_top_right,rgba(248,241,114,0.16),transparent_38%)]",
        activeDot: "border-yellow bg-yellow shadow-[0_0_0_4px_rgba(248,241,114,0.14)]",
    },
    pink: {
        activeBorder: "border-pink/60",
        activeBackground: "from-pink/14 via-white/[0.04] to-transparent",
        activeRing: "ring-pink/25",
        activeGlow: "bg-[radial-gradient(circle_at_top_right,rgba(248,114,226,0.16),transparent_38%)]",
        activeDot: "border-pink bg-pink shadow-[0_0_0_4px_rgba(248,114,226,0.14)]",
    },
    blue: {
        activeBorder: "border-blue/60",
        activeBackground: "from-blue/14 via-white/[0.04] to-transparent",
        activeRing: "ring-blue/25",
        activeGlow: "bg-[radial-gradient(circle_at_top_right,rgba(114,169,248,0.16),transparent_38%)]",
        activeDot: "border-blue bg-blue shadow-[0_0_0_4px_rgba(114,169,248,0.14)]",
    },
    brand: {
        activeBorder: "border-brand/60",
        activeBackground: "from-brand/14 via-white/[0.04] to-transparent",
        activeRing: "ring-brand/25",
        activeGlow: "bg-[radial-gradient(circle_at_top_right,rgba(114,248,150,0.16),transparent_38%)]",
        activeDot: "border-brand bg-brand shadow-[0_0_0_4px_rgba(114,248,150,0.14)]",
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
    icon: React.ReactNode
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
                "relative overflow-hidden rounded-3xl border p-4 text-left transition-all duration-300",
                "shadow-[0_18px_48px_rgba(0,0,0,0.22)]",
                disabled
                    ? "cursor-not-allowed border-white/8 opacity-45"
                    : "border-white/10 hover:border-white/20 hover:bg-white/5",
                active && cn("bg-linear-to-br ring-1", accentStyles.activeBorder, accentStyles.activeBackground, accentStyles.activeRing),
            )}
        >
            <div
                aria-hidden="true"
                className={cn(
                    "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300",
                    active && "opacity-100",
                    accentStyles.activeGlow,
                )}
            />
            <div className="relative z-10 flex flex-col gap-2">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/80">
                    {icon}
                </div>
                <div>
                    <p className="text-base font-semibold text-white">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-white/75">{description}</p>
                </div>
            </div>
            <div
                className={cn(
                    "absolute right-4 top-4 h-4 w-4 rounded-full border transition-colors duration-300",
                    active ? accentStyles.activeDot : "border-white/20",
                )}
            />
        </button>
    )
}

function FeatureRow({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode
    title: string
    description: string
}) {
    return (
        <div className="flex items-start gap-4 rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-5">
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/85">
                {icon}
            </div>
            <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">{title}</p>
                <p className="mt-2 text-sm leading-6 text-white/68">{description}</p>
            </div>
        </div>
    )
}

export function SubscriptionConfigurator() {
    const [deployment, setDeployment] = useState<DeploymentMode>("cloud")
    const [customerType, setCustomerType] = useState<CustomerType>("b2c")
    const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("pro")
    const [teamSeats, setTeamSeats] = useState(12)
    const [runtimeMode, setRuntimeMode] = useState<RuntimeMode>("monthly")
    const [runtimeMinutes, setRuntimeMinutes] = useState(2400)

    return (
        <div className="grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.85fr)]">
            <section className="relative overflow-hidden">

                <div className="relative z-10 flex flex-col gap-8">
                    <div className="max-w-2xl">
                        <h1 className="mt-4 max-w-xl text-balance text-3xl font-semibold text-white lg:text-4xl">
                            Configure your setup before you talk pricing.
                        </h1>
                        <p className="mt-4 max-w-xl text-base leading-7 text-white/75 lg:text-lg">
                            Pick your operating model, customer shape, and usage pattern. The right-hand side updates
                            into a purchase-ready configuration flow instead of a generic pricing table.
                        </p>
                    </div>

                    <div className="grid gap-4">
                        <FeatureRow
                            icon={<IconRocket size={22} />}
                            title="Fast onboarding"
                            description="Move from evaluation to a concrete subscription path without guessing which packaging model fits your rollout."
                        />
                        <FeatureRow
                            icon={<IconUserShield size={22} />}
                            title="Commercial clarity"
                            description="Separate customer type, hosting model, and runtime expectations before a plan is proposed."
                        />
                        <FeatureRow
                            icon={<IconGauge size={22} />}
                            title="Usage visibility"
                            description="Cloud deployments can be framed around monthly runtime needs or a pay-as-you-go usage model."
                        />
                        <FeatureRow
                            icon={<IconGauge size={22} />}
                            title="Usage visibility"
                            description="Cloud deployments can be framed around monthly runtime needs or a pay-as-you-go usage model."
                        />
                        <FeatureRow
                            icon={<IconGauge size={22} />}
                            title="Usage visibility"
                            description="Cloud deployments can be framed around monthly runtime needs or a pay-as-you-go usage model."
                        />
                    </div>
                </div>
            </section>

            <section className="relative overflow-hidden rounded-4xl ring ring-white/5 shadow-md bg-linear-to-br from-[#0e1921]/70 to-primary/50 p-6">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                />
                <div className="relative z-10 flex flex-col gap-8">
                    <h2 className="text-2xl font-semibold text-white lg:text-3xl">Build the subscription shape</h2>

                    <div className="space-y-4">
                        <p className="text-lg font-semibold tracking-wider text-white/50">Deployment</p>
                        <div className="grid gap-3 md:grid-cols-2">
                            <OptionCard
                                title="Self-hosted"
                                description="Deploy on your own infrastructure with full operational control."
                                icon={<IconServer size={20} />}
                                accent="yellow"
                                active={deployment === "self-hosted"}
                                onClick={() => setDeployment("self-hosted")}
                            />
                            <OptionCard
                                title="Cloud"
                                description="Use managed infrastructure with selectable runtime consumption."
                                icon={<IconCloud size={20} />}
                                accent="aqua"
                                active={deployment === "cloud"}
                                onClick={() => setDeployment("cloud")}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-lg font-semibold tracking-wider text-white/50">Customer Type</p>
                        <div className="grid gap-3 md:grid-cols-2">
                            <OptionCard
                                title="B2B"
                                description="Organization purchase flow with tailored commercial handling."
                                icon={<IconBriefcase2 size={20} />}
                                accent="blue"
                                active={customerType === "b2b"}
                                onClick={() => setCustomerType("b2b")}
                            />
                            <OptionCard
                                title="B2C"
                                description="Standardized subscription flow with directly selectable plans."
                                icon={<IconBuildingStore size={20} />}
                                accent="pink"
                                active={customerType === "b2c"}
                                onClick={() => setCustomerType("b2c")}
                            />
                        </div>
                    </div>

                    {customerType === "b2c" ? (
                        <div className="space-y-4">
                            <p className="text-lg font-semibold tracking-wider text-white/50">Subscription tier</p>
                            <div className="grid gap-3 md:grid-cols-2">
                                <OptionCard
                                    title="PRO"
                                    description="Single-owner setup for advanced personal or expert workflows."
                                    icon={<IconSparkles size={20} />}
                                    accent="brand"
                                    active={subscriptionTier === "pro"}
                                    onClick={() => setSubscriptionTier("pro")}
                                />
                                <OptionCard
                                    title="TEAM"
                                    description="Shared workspace model with seat-based team access."
                                    icon={<IconUsersGroup size={20} />}
                                    accent="aqua"
                                    active={subscriptionTier === "team"}
                                    onClick={() => setSubscriptionTier("team")}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-5">
                            <p className="text-sm font-semibold text-white">B2B path</p>
                            <p className="mt-2 text-sm leading-6 text-white/65">
                                For B2B, `PRO` and `TEAM` subscriptions are not available. This path moves into a custom
                                enterprise-style offer instead.
                            </p>
                        </div>
                    )}

                    {customerType === "b2c" && subscriptionTier === "team" ? (
                        <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/45">Seats</p>
                                    <p className="mt-2 text-sm text-white/65">How many user seats do you need?</p>
                                </div>
                                <div className="rounded-2xl border border-aqua/25 bg-aqua/10 px-4 py-2 text-xl font-semibold text-aqua">
                                    {teamSeats}
                                </div>
                            </div>
                            <input
                                type="range"
                                min={2}
                                max={250}
                                step={1}
                                value={teamSeats}
                                onChange={(event) => setTeamSeats(Number(event.target.value))}
                                className="mt-5 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-aqua"
                            />
                            <div className="mt-2 flex justify-between text-xs text-white/38">
                                <span>2 seats</span>
                                <span>250 seats</span>
                            </div>
                        </div>
                    ) : null}

                    {deployment === "cloud" ? (
                        <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/45">Runtime</p>
                                    <p className="mt-2 text-sm text-white/65">
                                        Select monthly runtime minutes or switch to pay-as-you-go consumption.
                                    </p>
                                </div>
                                <div className="inline-flex rounded-2xl border border-white/10 bg-black/20 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setRuntimeMode("monthly")}
                                        className={cn(
                                            "rounded-[1rem] px-3 py-2 text-xs font-medium transition-colors",
                                            runtimeMode === "monthly" ? "bg-white text-primary" : "text-white/60",
                                        )}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRuntimeMode("payg")}
                                        className={cn(
                                            "rounded-[1rem] px-3 py-2 text-xs font-medium transition-colors",
                                            runtimeMode === "payg" ? "bg-white text-primary" : "text-white/60",
                                        )}
                                    >
                                        Pay as you go
                                    </button>
                                </div>
                            </div>

                            {runtimeMode === "monthly" ? (
                                <>
                                    <div className="mt-5 flex items-center justify-between gap-4">
                                        <span className="text-sm text-white/55">Monthly runtime minutes</span>
                                        <span className="rounded-2xl border border-blue/25 bg-blue/12 px-4 py-2 text-xl font-semibold text-blue">
                                            {runtimeMinutes.toLocaleString("en-US")}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={200}
                                        max={10000}
                                        step={100}
                                        value={runtimeMinutes}
                                        onChange={(event) => setRuntimeMinutes(Number(event.target.value))}
                                        className="mt-5 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-blue"
                                    />
                                    <div className="mt-2 flex justify-between text-xs text-white/38">
                                        <span>200 min</span>
                                        <span>10,000 min</span>
                                    </div>
                                </>
                            ) : (
                                <div className="mt-5 rounded-3xl border border-white/8 bg-black/20 p-4 text-sm leading-6 text-white/68">
                                    Usage is billed based on actual cloud runtime consumption instead of a fixed monthly
                                    minute pack.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
                            <div className="flex items-start gap-4">
                                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/80">
                                    <IconDatabase size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">Runtime is handled on your infrastructure</p>
                                    <p className="mt-2 text-sm leading-6 text-white/65">
                                        Runtime minutes are only configurable for cloud deployments. Self-hosted usage stays under your own operational control.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/45">Additional features</p>
                        <OptionCard
                            title="No add-ons available yet"
                            description="Additional purchasable features are not available at the moment."
                            icon={<IconSparkles size={20} />}
                            accent="blue"
                            active={false}
                            disabled
                        />
                    </div>
                </div>
            </section>
        </div>
    )
}
