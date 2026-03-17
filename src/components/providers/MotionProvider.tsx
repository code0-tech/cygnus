"use client"

import { LazyMotion, MotionConfig, domAnimation } from "motion/react"
import type { ReactNode } from "react"

export function MotionProvider({ children }: { children: ReactNode }) {
    return (
        <LazyMotion features={domAnimation} strict>
            <MotionConfig reducedMotion="user">
                {children}
            </MotionConfig>
        </LazyMotion>
    )
}
