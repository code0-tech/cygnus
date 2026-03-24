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
                "glass-card-shell group h-full rounded-[1.6rem] shadow-[0_14px_42px_rgba(0,0,0,0.3)]! transition-[transform,opacity] duration-700 ease-out before:pointer-events-none before:absolute before:inset-1px before:rounded-[calc(1.6rem-1px)] before:border before:border-white/6 before:content-['']",
                isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
                className,
            )}
            style={{ transitionDelay: `${animationDelay}ms` }}
        >
            <div aria-hidden="true" className="glass-card-topline" />
            <div className={cn("pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.02),transparent_20%)] bg-linear-to-br opacity-30", toneStyle.glow)} />
            <div className={cn("absolute inset-0 z-10 flex h-full flex-col items-stretch justify-start gap-4 p-5 md:p-6", contentClassName)}>
                {children}
            </div>
        </div>
    )
}
