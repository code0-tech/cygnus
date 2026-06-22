"use client"

import { cn } from "@/lib/utils"

interface DotBackgroundProps {
    className?: string
    dotColor?: string
    dotSize?: number
    spacing?: number
}

export function DotBackground({ className, dotColor = "rgba(255,255,255,0.22)", dotSize = 1, spacing = 12 }: DotBackgroundProps) {
    return (
        <div
            aria-hidden="true"
            className={cn("pointer-events-none absolute inset-0", className)}
            style={{
                backgroundImage: `radial-gradient(circle, ${dotColor} ${dotSize}px, transparent ${dotSize}px)`,
                backgroundSize: `${spacing}px ${spacing}px`,
            }}
        />
    )
}
