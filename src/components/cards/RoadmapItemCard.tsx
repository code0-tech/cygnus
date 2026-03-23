"use client"

import { StableBadge } from "../ui/StableBadge"

interface RoadmapItemCardProps {
    time: string
    title: string
    description: string
}

export function RoadmapItemCard({ time, title, description }: RoadmapItemCardProps) {
    return (
        <div className="relative z-10 cursor-default isolate overflow-hidden rounded-3xl border border-white/8 bg-[linear-gradient(180deg,rgba(16,18,34,0.88),rgba(12,14,28,0.78))] p-6 shadow-[0_16px_42px_rgba(0,0,0,0.22)] transition-transform duration-300 ease-in-out before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-white/22 before:to-transparent before:content-['']">
            <StableBadge color="info" className="text-sm px-3 py-1">{time}</StableBadge>
            <h3 className="mt-4 text-xl font-semibold tracking-tight text-white md:text-2xl">{title}</h3>
            <p className="mt-1 text-sm text-white/75">{description}</p>
        </div>
    )
}
