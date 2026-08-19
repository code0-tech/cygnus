import type { IconColor } from "@/lib/cms"
import type { ReactNode } from "react"

export interface SummaryBadgeProps {
    icon: ReactNode
    value: ReactNode
    tone?: IconColor
    size?: "sm" | "lg"
}

const ICON_TONE_CLASS_NAME: Record<IconColor, string> = {
    neutral: "text-white",
    brand: "text-brand",
    aqua: "text-aqua",
    blue: "text-blue",
    pink: "text-pink",
    yellow: "text-yellow",
    lime: "text-lime",
    magenta: "text-magenta",
}

const CONTAINER_TONE_CLASS_NAME: Record<IconColor, string> = {
    neutral: "border-white/10 bg-white/5",
    brand: "border-brand/10 bg-brand/5",
    aqua: "border-aqua/10 bg-aqua/5",
    blue: "border-blue/10 bg-blue/5",
    pink: "border-pink/10 bg-pink/5",
    yellow: "border-yellow/10 bg-yellow/5",
    lime: "border-lime/10 bg-lime/5",
    magenta: "border-magenta/10 bg-magenta/5",
}

const SIZE_CLASS_NAME: Record<"sm" | "lg", string> = {
    sm: "gap-1 pl-1 pr-2 py-0.5 text-xs",
    lg: "gap-1.5 pl-2 pr-3 py-0.5 text-base",
}

export function SummaryBadge({ icon, value, tone = "neutral", size = "sm" }: SummaryBadgeProps) {
    return (
        <span className={`inline-flex min-w-0 max-w-full items-center rounded-xl border ${SIZE_CLASS_NAME[size]} ${CONTAINER_TONE_CLASS_NAME[tone]}`}>
            <span className={`inline-flex shrink-0 ${ICON_TONE_CLASS_NAME[tone]}`}>{icon}</span>
            <span className="min-w-0 truncate font-medium text-white">{value}</span>
        </span>
    )
}
