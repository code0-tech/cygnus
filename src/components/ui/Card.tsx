"use client"

import * as React from "react"
import { m as motion, type Variants, type HTMLMotionProps } from "motion/react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

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
    }

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, variant, size, topline = true, variants, children, ...props }, ref) => {
    const Component: any = variants ? motion.div : "div"
    return (
        <Component ref={ref} className={cn(cardVariants({ variant, size }), className)} variants={variants} {...props}>
            {topline && <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />}
            {children}
        </Component>
    )
})
Card.displayName = "Card"

export { Card }
export type { CardProps }
