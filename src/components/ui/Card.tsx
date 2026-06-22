"use client"

import * as React from "react"
import { m as motion, type Variants, type HTMLMotionProps } from "motion/react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardGradients = {
    blue: "rgba(114,201,248,0.2)",
    yellow: "rgba(248,241,114,0.2)",
    pink: "rgba(248,114,226,0.2)",
    aqua: "rgba(122,203,255,0.2)",
    brand: "rgba(145,232,120,0.2)",
    neutral: "rgba(255,255,255,0.1)",
} as const

const gradientDirections = {
    topLeft: "top left",
    topRight: "top right",
    bottomLeft: "bottom left",
    bottomRight: "bottom right",
} as const

const cardVariants = cva("relative border border-white/5", {
    variants: {
        variant: {
            default: "",
            light: "bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_28%,rgba(8,10,20,0.6)_100%)]",
        },
        size: {
            sm: "p-2 rounded-xl",
            md: "p-4 rounded-2xl",
            lg: "p-6 rounded-3xl",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "md",
    },
})

type CardProps = HTMLMotionProps<"div"> &
    VariantProps<typeof cardVariants> & {
        topline?: boolean
        variants?: Variants
        radialGradient?: keyof typeof cardGradients | null
        gradientDirection?: keyof typeof gradientDirections | null
    }

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, variant, size, topline = true, radialGradient, gradientDirection, variants, children, ...props }, ref) => {
    const Component: any = variants ? motion.div : "div"
    return (
        <Component ref={ref} className={cn(cardVariants({ variant, size }), className)} variants={variants} {...props}>
            {topline && <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />}
            {radialGradient && gradientDirection && (
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle at ${gradientDirections[gradientDirection]}, ${cardGradients[radialGradient]}, transparent 36%)`,
                    }}
                />
            )}
            {children}
        </Component>
    )
})
Card.displayName = "Card"

export { Card }
export type { CardProps }
