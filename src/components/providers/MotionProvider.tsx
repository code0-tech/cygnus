"use client"

import { LazyMotion, MotionConfig, domAnimation } from "motion/react"
import type { ReactNode } from "react"

export function MotionProvider({ children }: { children: ReactNode }) {
    return (
        // Not `strict`: pictor's components (SegmentedControl, Dialog, Tooltip, ...) render `motion.*` internally,
        // which strict mode turns into a runtime error. Our own components still use `m` to stay tree-shakeable.
        <LazyMotion features={domAnimation}>
            <MotionConfig reducedMotion="user">
                {children}
            </MotionConfig>
        </LazyMotion>
    )
}
