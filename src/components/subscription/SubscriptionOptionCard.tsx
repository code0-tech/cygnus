import { StableBadge } from "@/components/ui/StableBadge"
import { cn } from "@/lib/utils"
import type { CSSProperties, ReactNode } from "react"

type SubscriptionOptionAccent = "aqua" | "yellow" | "pink" | "blue" | "brand" | "lime" | "magenta"

const SUBSCRIPTION_OPTION_ACTIVE_GLOW_STYLE: CSSProperties = {
    background: "radial-gradient(circle at top right, color-mix(in oklab, var(--option-accent) 16%, transparent), transparent 38%)",
}

const SUBSCRIPTION_OPTION_ACTIVE_ICON_STYLE: CSSProperties = {
    color: "var(--option-accent)",
}

function getSubscriptionOptionAccentStyle(accent: SubscriptionOptionAccent, active: boolean): CSSProperties {
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

interface SubscriptionOptionCardProps {
    title: string
    description: string
    active: boolean
    onClick?: () => void
    icon: ReactNode
    disabled?: boolean
    accent?: SubscriptionOptionAccent
    badge?: string
}

export function SubscriptionOptionCard({ title, description, active, onClick, icon, disabled = false, accent = "aqua", badge }: SubscriptionOptionCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            style={getSubscriptionOptionAccentStyle(accent, active)}
            className={cn(
                "relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300",
                disabled ? "cursor-not-allowed border-white/10 opacity-45" : "border-white/10 hover:bg-light"
            )}
        >
            <div className="relative z-10 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                    <div className="relative inline-flex shrink-0 items-center justify-center">
                        {active ? (
                            <div
                                aria-hidden="true"
                                style={SUBSCRIPTION_OPTION_ACTIVE_GLOW_STYLE}
                                className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl"
                            />
                        ) : null}
                        <div
                            style={active ? SUBSCRIPTION_OPTION_ACTIVE_ICON_STYLE : undefined}
                            className="relative inline-flex items-center justify-center text-secondary [&>svg]:h-[1.05em] [&>svg]:w-[1.05em]"
                        >
                            {icon}
                        </div>
                    </div>
                    <p className="text-xl text-white" style={active ? SUBSCRIPTION_OPTION_ACTIVE_ICON_STYLE : undefined}>
                        {title}
                    </p>
                    {badge && (
                        <StableBadge border className="ml-auto shrink-0 border-brand/10! bg-brand/10! px-2! py-0.5! text-brand! text-base!">
                            {badge}
                        </StableBadge>
                    )}
                </div>
                <p className="text-base text-secondary">{description}</p>
            </div>
        </button>
    )
}
