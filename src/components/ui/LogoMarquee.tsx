"use client"

import type { Media } from "@/payload-types"
import { LogoItem } from "@/components/ui/LogoItem"
import { m as motion } from "motion/react"

interface LogoMarqueeProps {
    logos: Array<number | Media>
    duration?: number
}

export function LogoMarquee({ logos, duration = 18 }: LogoMarqueeProps) {
    const marqueeLogos = [...logos, ...logos]
    if (logos.length === 0) return null

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
                {marqueeLogos.map((item, index) => (
                    <LogoItem
                        key={`${(item as Media).id ?? (item as Media).url ?? index}-${index}`}
                        logo={item}
                        className="w-32 shrink-0 sm:w-40 md:w-40 lg:w-48"
                    />
                ))}
            </motion.div>
        </div>
    )
}
