"use client"

import { ANIMATION_PRESETS, type AnimationPreset } from "@/lib/utils"
import { m as motion } from "motion/react"
import type { ReactNode } from "react"

interface OffsetCardMotionProps {
    children: ReactNode
    className?: string
    index: number
    preset: Exclude<AnimationPreset, "none">
}

export function OffsetCardMotion({ children, className, index, preset }: OffsetCardMotionProps) {
    const animationConfig = ANIMATION_PRESETS[preset]

    return (
        <motion.div
            className={className}
            initial={animationConfig.initial}
            whileInView={animationConfig.whileInView}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
                ...animationConfig.transition,
                delay: index * 0.08,
            }}
        >
            {children}
        </motion.div>
    )
}
