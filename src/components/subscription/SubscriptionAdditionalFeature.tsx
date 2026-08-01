import { getSubscriptionOptionAccentStyle, SUBSCRIPTION_OPTION_ACTIVE_GLOW_STYLE, SUBSCRIPTION_OPTION_ACTIVE_ICON_STYLE } from "@/components/subscription/SubscriptionOptionCard"
import { FormattedText, hasHighlightedText } from "@/components/ui/FormattedText"
import { cn } from "@/lib/utils"
import { IconCheck } from "@tabler/icons-react"
import type { ReactNode } from "react"

interface SubscriptionAdditionalFeatureProps {
    title: string
    description: string
    active: boolean
    onClick?: () => void
    icon: ReactNode
    formattedPrice: string
}

export function SubscriptionAdditionalFeature({ title, description, active, onClick, icon, formattedPrice }: SubscriptionAdditionalFeatureProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={getSubscriptionOptionAccentStyle("brand", active)}
            className="relative overflow-hidden rounded-2xl border border-white/10 p-3 text-left transition-all duration-300 hover:bg-light"
        >
            <div className="relative z-10 flex flex-col gap-2">
                <div className="flex items-center gap-2">
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
                    <p className={cn("text-base font-semibold", hasHighlightedText(title) ? "text-secondary" : "text-white")}>
                        <FormattedText text={title} />
                    </p>
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
