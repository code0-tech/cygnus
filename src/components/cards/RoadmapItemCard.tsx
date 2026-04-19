"use client"

import { cn } from "@/lib/utils"
import { StableBadge } from "../ui/StableBadge"

interface RoadmapItemCardProps {
    time: string
    title: string
    description: string
    className?: string
}

export function RoadmapItemCard({ time, title, description, className }: RoadmapItemCardProps) {
    return (
        <div className={cn("glass-card-shell relative ml-8 md:ml-0 z-10 cursor-default isolate p-4", className)}>
            <div aria-hidden="true" className="glass-card-topline" />
            <StableBadge color="info" className="text-sm px-3 py-1">{time}</StableBadge>
            <h3 className="mt-4 text-xl font-semibold tracking-tight text-white md:text-2xl">{title}</h3>
            <p className="my-2 text-sm text-white/75">{description}</p>
        </div>
    )
}
