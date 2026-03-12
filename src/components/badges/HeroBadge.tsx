"use client"

import { Badge } from "@code0-tech/pictor"
import { IconArrowRight } from "@tabler/icons-react"

export function HeroBadge({ badge }: { badge?: string | null }) {
    if (!badge) return null

    return (
        <Badge className="relative z-10 text-xs! px-2! cursor-default!" color="info" suppressHydrationWarning>
            {badge}
            <IconArrowRight size={14} />
        </Badge>
    )
}
