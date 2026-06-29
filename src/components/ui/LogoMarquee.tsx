"use client"

import type { Media } from "@/payload-types"
import { LogoItem } from "@/components/ui/LogoItem"
import { m as motion } from "motion/react"

interface LogoMarqueeProps {
    items: Array<{
        id: string
        logo: number | Media
    }>
    duration?: number
}

export function LogoMarquee({ items, duration = 18 }: LogoMarqueeProps) {
    const marqueeItems = [
        ...items.map((item) => ({ ...item, copy: "primary" as const })),
        ...items.map((item) => ({ ...item, copy: "duplicate" as const })),
    ]
    if (items.length === 0) return null

    return (
        <div className="relative w-full overflow-hidden">
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-linear-to-r from-primary to-transparent" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-linear-to-l from-primary to-transparent" />
            <motion.div
                className="flex w-max gap-16"
                animate={{ x: ["0%", "-50%"] }}
                transition={{
                    duration,
                    ease: "linear",
                    repeat: Infinity,
                }}
            >
                {marqueeItems.map((item) => (
                    <LogoItem key={`${item.copy}-${item.id}`} logo={item.logo} className="w-32 shrink-0 sm:w-40 md:w-40 lg:w-48" />
                ))}
            </motion.div>
        </div>
    )
}
