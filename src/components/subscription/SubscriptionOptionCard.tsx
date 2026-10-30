import { Card } from "@/components/ui/Card"
import { cn } from "@/lib/utils"
import { IconCheck } from "@tabler/icons-react"
import type { CSSProperties, ReactNode } from "react"

type SubscriptionOptionAccent = "aqua" | "yellow" | "pink" | "blue" | "brand" | "lime" | "magenta" | "neutral"

// Options of one configurator step share this container; the active card is highlighted inside it.
export function SubscriptionOptionGroup({ children }: { children: ReactNode }) {
    return (
        <Card variant="light" className="grid gap-1 rounded-2xl p-1.5">
            {children}
        </Card>
    )
}

const mixAccent = (color: string, percent: number) => `color-mix(in oklab, ${color} ${percent}%, transparent)`

export interface SubscriptionOptionPrice {
    amount: string
    suffix: string
    // A difference to the current selection rather than the price of the selection itself.
    relative?: boolean
}

interface SubscriptionOptionCardProps {
    title: string
    description: string
    active: boolean
    onClick?: () => void
    disabled?: boolean
    accent?: SubscriptionOptionAccent
    badge?: string
    price?: SubscriptionOptionPrice
    children?: ReactNode
}

export function SubscriptionOptionCard({ title, description, active, onClick, disabled = false, accent = "aqua", badge, price, children }: SubscriptionOptionCardProps) {
    const accentColor = `var(--bg-${accent})`
    const activeStyle: CSSProperties = { background: `linear-gradient(to right, ${mixAccent(accentColor, 18)}, ${mixAccent(accentColor, 2)} 70%)` }

    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            disabled={disabled}
            style={active ? activeStyle : undefined}
            className={cn("flex w-full items-start gap-4 rounded-xl px-4 py-3.5 text-left transition-colors duration-200", !active && "hover:bg-white/4", disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer")}
        >
            <span
                aria-hidden="true"
                style={active ? { background: accentColor, borderColor: accentColor } : undefined}
                className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-primary transition-colors duration-200", !active && "border-white/25")}
            >
                {active && <IconCheck size={12} stroke={3} />}
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-base font-medium text-white">{title}</p>
                    {badge && (
                        <span style={{ background: mixAccent(accentColor, 15), color: accentColor }} className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium">
                            {badge}
                        </span>
                    )}
                </div>
                <p className="mt-0.5 text-sm text-secondary">{description}</p>
                {children}
                {price && (
                    <p className="mt-2 flex items-baseline gap-1 whitespace-nowrap">
                        <span className={cn("text-base tabular-nums", price.relative ? "text-secondary" : "font-semibold text-white")}>{price.amount}</span>
                        <span className="text-xs text-tertiary">{price.suffix}</span>
                    </p>
                )}
            </div>
        </button>
    )
}
