import { cn } from "@/lib/utils"
import { ReactNode } from "react"
import { Card } from "../ui/Card"

type FeatureCardTone = "brand" | "aqua" | "blue" | "pink" | "yellow" | "lime" | "magenta"
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
    },
    lime: {
        glow: "from-lime/22 via-lime/8 to-transparent",
        orb: "bg-lime/18",
    },
    magenta: {
        glow: "from-magenta/22 via-magenta/8 to-transparent",
        orb: "bg-magenta/18",
    },
}

interface FeatureCardProps {
    children: ReactNode
    className?: string
    contentClassName?: string
    tone?: FeatureCardTone
    style?: FeatureCardStyle
    animationDelay?: number
}

export function FeatureCard({ children, className, contentClassName, tone = "brand", style, animationDelay = 0 }: FeatureCardProps) {
    const toneStyle = {
        ...toneStyles[tone],
        ...style,
    }

    return (
        <Card
            size="lg"
            className={cn(
                "group h-full translate-y-8 opacity-0 transition-[transform,opacity] duration-700 ease-out group-data-[in-view=true]/section:translate-y-0 group-data-[in-view=true]/section:opacity-100",
                className
            )}
            style={{ transitionDelay: `${animationDelay}ms` }}
        >
            <div className={cn("pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.02),transparent_20%)] bg-linear-to-br opacity-30", toneStyle.glow)} />
            <div className={cn("absolute inset-0 z-10 flex h-full flex-col items-stretch justify-start gap-4 p-5 md:p-6", contentClassName)}>{children}</div>
        </Card>
    )
}
