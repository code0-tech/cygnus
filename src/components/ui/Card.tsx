"use client"

import { m as motion, type Variants, type HTMLMotionProps } from "motion/react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardGradients = {
    blue: "oklch(0.6232 0.1948 279.8 / 0.2)",
    yellow: "oklch(0.9391 0.1483 106.03 / 0.2)",
    pink: "oklch(0.7477 0.2075 334.16 / 0.2)",
    aqua: "oklch(0.7991 0.1074 233.93 / 0.2)",
    brand: "oklch(0.9018 0.165 157.04 / 0.2)",
    lime: "oklch(0.9332 0.1813 127.46 / 0.2)",
    magenta: "oklch(0.7321 0.2231 319.1 / 0.2)",
    neutral: "oklch(1 0 0 / 0.1)",
} as const

const gradientDirections = {
    topLeft: "top left",
    topRight: "top right",
    bottomLeft: "bottom left",
    bottomRight: "bottom right",
} as const

const cardVariants = cva("relative overflow-hidden border border-white/5", {
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

function Card({ className, variant, size, topline = true, radialGradient, gradientDirection, variants, children, ref, ...props }: CardProps) {
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
}

export { Card }
