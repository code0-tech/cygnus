import type { IconColor } from "@/lib/cms"
import { Badge } from "@code0-tech/pictor"
import type { ReactNode } from "react"

export interface SummaryBadgeProps {
    icon: ReactNode
    value: ReactNode
    tone?: IconColor
    size?: "sm" | "lg"
}

const TONE_CLASS_NAME: Record<IconColor, string> = {
    neutral: "border-white/10! bg-white/10! text-white!",
    brand: "border-brand/10! bg-brand/10! text-brand!",
    aqua: "border-aqua/10! bg-aqua/10! text-aqua!",
    blue: "border-blue/10! bg-blue/10! text-blue!",
    pink: "border-pink/10! bg-pink/10! text-pink!",
    yellow: "border-yellow/10! bg-yellow/10! text-yellow!",
    lime: "border-lime/10! bg-lime/10! text-lime!",
    magenta: "border-magenta/10! bg-magenta/10! text-magenta!",
}

export function SummaryBadge({ icon, value, tone = "neutral" }: SummaryBadgeProps) {
    return (
        <Badge color="secondary" border className={`min-w-0! max-w-full! rounded-xl! gap-1.5! pl-1.5! pr-2.5! py-0.5! text-sm! ${TONE_CLASS_NAME[tone]}`}>
            <span className="inline-flex shrink-0 text-current">{icon}</span>
            <span className="min-w-0 truncate font-medium">{value}</span>
        </Badge>
    )
}
