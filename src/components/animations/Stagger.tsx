"use client"

import { m as motion, type Variants } from "motion/react"
import type { ReactNode } from "react"

interface StaggerContainerProps {
    children: ReactNode
    className?: string
    delayChildren?: number
    staggerChildren?: number
    disabled?: boolean
}

interface StaggerItemProps {
    children: ReactNode
    className?: string
    as?: "div" | "h1" | "h2" | "p" | "ul"
    y?: number
    duration?: number
}

export function StaggerContainer({ children, className, delayChildren = 0, staggerChildren = 0.08, disabled = false }: StaggerContainerProps) {
    const variants: Variants = {
        hidden: {},
        show: { transition: { staggerChildren, delayChildren } },
    }

    return (
        <motion.div className={className} variants={variants} initial={disabled ? false : "hidden"} whileInView={disabled ? undefined : "show"} viewport={disabled ? undefined : { once: true, amount: 0.25 }}>
            {children}
        </motion.div>
    )
}

export function StaggerItem({ children, className, as = "div", y = 12, duration = 0.3 }: StaggerItemProps) {
    const Component = motion[as]
    const variants: Variants = {
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration, ease: [0.22, 1, 0.36, 1] } },
    }

    return (
        <Component variants={variants} className={className}>
            {children}
        </Component>
    )
}
