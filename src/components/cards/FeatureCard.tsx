"use client"

import { cn } from "@/lib/utils"
import { ReactNode, useEffect, useRef, useState } from "react"

type FeatureCardTone = "brand" | "aqua" | "blue" | "pink" | "yellow"
type FeatureCardStyle = {
    glow?: string
    orb?: string
}

const toneStyles: Record<FeatureCardTone, Required<FeatureCardStyle>> = {
    brand: {
        glow: "from-brand/22 via-brand/8 to-transparent",
        orb: "bg-brand/18",
    },
    aqua: {
        glow: "from-aqua/22 via-aqua/8 to-transparent",
        orb: "bg-aqua/18",
    },
    blue: {
        glow: "from-blue/22 via-blue/8 to-transparent",
        orb: "bg-blue/18",
    },
    pink: {
        glow: "from-pink/22 via-pink/8 to-transparent",
        orb: "bg-pink/18",
    },
    yellow: {
        glow: "from-yellow/22 via-yellow/8 to-transparent",
        orb: "bg-yellow/18",
    }
}

export function FeatureCard({
    children,
    className,
    contentClassName,
    tone = "brand",
    style,
    animationDelay = 0
}: {
    children: ReactNode,
    className?: string,
    contentClassName?: string,
    tone?: FeatureCardTone,
    style?: FeatureCardStyle,
    animationDelay?: number
}) {
    const [isVisible, setIsVisible] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)
    const toneStyle = {
        ...toneStyles[tone],
        ...style,
    }

    useEffect(() => {
        const currentRef = cardRef.current
        if (!currentRef) return

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true)
                observer.unobserve(currentRef)
            }
        }, { rootMargin: "100px" })

        observer.observe(currentRef)

        return () => observer.disconnect()
    }, [])

    return (
        <div
            ref={cardRef}
            className={cn(
                "group relative h-full overflow-hidden rounded-[1.6rem] border border-white/8 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_28%,rgba(8,10,20,0.92)_100%)] shadow-[0_18px_60px_rgba(0,0,0,0.35)] transition-[transform,opacity] duration-700 ease-out before:pointer-events-none before:absolute before:inset-1px before:rounded-[calc(1.6rem-1px)] before:border before:border-white/6 before:content-[''] after:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-linear-to-r after:from-transparent after:via-white/30 after:to-transparent after:content-['']",
                isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
                className,
            )}
            style={{ transitionDelay: `${animationDelay}ms` }}
        >
            <div className="pointer-events-none absolute inset-0 opacity-[0.14] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_40%),linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-position-[center,center,center,center] bg-size-[auto,auto,32px_32px,32px_32px] mask-[linear-gradient(180deg,rgba(0,0,0,0.75),transparent_92%)]" />
            <div className={cn("pointer-events-none absolute -left-14 -top-14 h-36 w-36 rounded-full blur-2xl opacity-95 transition-transform duration-700", toneStyle.orb)} />
            <div className={cn("pointer-events-none absolute inset-0 bg-linear-to-br opacity-90", toneStyle.glow)} />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(8,10,20,0),rgba(8,10,20,0.58)_58%,rgba(8,10,20,0.9))]" />

            <div className={cn("absolute inset-0 z-10 flex flex-col justify-start items-center gap-4 p-5 md:p-6", contentClassName)}>
                {children}
            </div>
        </div>
    )
}
