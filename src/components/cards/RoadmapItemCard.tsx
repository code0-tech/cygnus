"use client"

import { StableBadge } from "../ui/StableBadge"

interface RoadmapItemCardProps {
    time: string
    title: string
    description: string
}

export function RoadmapItemCard({ time, title, description }: RoadmapItemCardProps) {
    return (
        <div className="glass-card-shell relative ml-8 md:ml-0 z-10 cursor-default isolate p-6">
            <div aria-hidden="true" className="glass-card-topline opacity-75" />
            <StableBadge color="info" className="text-sm px-3 py-1">{time}</StableBadge>
            <h3 className="mt-4 text-xl font-semibold tracking-tight text-white md:text-2xl">{title}</h3>
            <p className="mt-1 text-sm text-white/75">{description}</p>
        </div>
    )
}
