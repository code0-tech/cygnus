import { mixAccent, type SubscriptionOptionAccent, type SubscriptionOptionPrice } from "@/components/subscription/SubscriptionOptionCard"
import { PackageSlider } from "@/components/ui/PackageSlider"
import { cn } from "@/lib/utils"
import { IconCheck } from "@tabler/icons-react"
import { useId, type ComponentProps, type CSSProperties, type ReactNode } from "react"

export interface SubscriptionPlanStat {
    label: string
    value: string
    comparison?: string
}

export interface SubscriptionPlanCapacity {
    value: string
    label: string
}

interface SubscriptionPlanCardProps {
    title: string
    description: string
    active: boolean
    onClick?: () => void
    accent?: SubscriptionOptionAccent
    capacity?: SubscriptionPlanCapacity
    details?: string
    stats?: SubscriptionPlanStat[]
    price?: SubscriptionOptionPrice
    priceNote?: string
    priceFallback?: string
    children?: ReactNode
}

export function SubscriptionPlanCard({ title, description, active, onClick, accent = "aqua", capacity, details, stats, price, priceNote, priceFallback, children }: SubscriptionPlanCardProps) {
    const titleId = useId()
    const descriptionId = useId()
    const accentColor = `var(--bg-${accent})`
    const activeStyle: CSSProperties = { background: mixAccent(accentColor, 8), borderColor: mixAccent(accentColor, 20) }
    const accentTextStyle: CSSProperties = { color: accentColor }

    return (
        <div
            style={active ? activeStyle : undefined}
            className={cn("relative flex items-start gap-4 rounded-xl border border-transparent px-4 py-4 transition-colors duration-200 sm:px-5", !active && "hover:bg-white/4")}
        >
            <button
                type="button"
                aria-pressed={active}
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                onClick={onClick}
                className="absolute inset-0 cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            />
            <span
                aria-hidden="true"
                style={active ? { background: accentColor, borderColor: accentColor } : undefined}
                className={cn(
                    "pointer-events-none relative mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-primary transition-colors duration-200",
                    !active && "border-white/25"
                )}
            >
                {active && <IconCheck size={14} stroke={3} />}
            </span>
            <div className="pointer-events-none relative min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p id={titleId} className="text-lg font-semibold text-white">
                            {title}
                        </p>
                        <p id={descriptionId} className="mt-1 text-sm text-secondary">
                            {description}
                        </p>
                    </div>
                    {capacity && (
                        <div className="shrink-0 text-right">
                            <p style={accentTextStyle} className="text-2xl font-bold leading-none tabular-nums sm:text-3xl">
                                {capacity.value}
                            </p>
                            <p className="mt-1 text-xs text-secondary">{capacity.label}</p>
                        </div>
                    )}
                </div>

                {details && <p className="mt-1.5 text-xs text-tertiary">{details}</p>}

                {stats && stats.length > 0 && (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {stats.map((stat) => (
                            <div key={stat.label} style={{ background: mixAccent(accentColor, 8) }} className="rounded-xl px-4 py-3">
                                <p style={accentTextStyle} className="text-xs font-medium">
                                    {stat.label}
                                </p>
                                <p className="mt-0.5 text-lg font-semibold tabular-nums text-white">{stat.value}</p>
                                {stat.comparison && (
                                    <p style={accentTextStyle} className="text-xs tabular-nums">
                                        {stat.comparison}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {children && <div className="pointer-events-auto mt-4 space-y-3">{children}</div>}

                {price && (
                    <p className={cn("flex items-baseline gap-1.5 whitespace-nowrap", stats || children ? "mt-4" : "mt-2")}>
                        <span className={cn("text-xl font-semibold tabular-nums", active ? "text-white" : "text-secondary")}>{price.amount}</span>
                        <span className="text-sm text-tertiary">{price.suffix}</span>
                    </p>
                )}
                {price && priceNote && (
                    <p style={accentTextStyle} className="mt-0.5 text-sm">
                        {priceNote}
                    </p>
                )}
                {!price && priceFallback && <p className="mt-2 text-sm text-secondary">{priceFallback}</p>}
            </div>
        </div>
    )
}

type SubscriptionPlanUsageSliderProps = Omit<ComponentProps<typeof PackageSlider>, "hideCenterLabel" | "centerLabelSuffix"> & {
    accent?: SubscriptionOptionAccent
    label: string
    valueLabel: string
}

export function SubscriptionPlanUsageSlider({ accent = "aqua", label, valueLabel, ...props }: SubscriptionPlanUsageSliderProps) {
    return (
        <div style={{ background: mixAccent(`var(--bg-${accent})`, 8) }} className="rounded-xl px-4 py-3">
            <div className="flex items-baseline justify-between gap-4">
                <p className="text-sm text-secondary">{label}</p>
                <p className="text-sm font-semibold tabular-nums text-white">{valueLabel}</p>
            </div>
            <PackageSlider {...props} flat hideCenterLabel />
        </div>
    )
}
