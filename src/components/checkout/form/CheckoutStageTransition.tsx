"use client"

import type { CheckoutStage } from "@/components/checkout/state/CheckoutStageProvider"
import { AnimatePresence, m as motion, useReducedMotion, type Variants } from "motion/react"
import { useLayoutEffect, useRef, useState, type ReactNode } from "react"

const STAGE_ORDER: Record<CheckoutStage, number> = { billingAddress: 0, payment: 1 }
const EASE = [0.22, 1, 0.36, 1] as const
const STAGE_OFFSET_PX = 16

// Forward slides the next step in from the right, going back from the left.
const stageVariants: Variants = {
    enter: (direction: number) => ({ opacity: 0, x: direction * STAGE_OFFSET_PX }),
    center: { opacity: 1, x: 0 },
    exit: (direction: number) => ({ opacity: 0, x: direction * -STAGE_OFFSET_PX }),
}

/**
 * Cross-fades between the billing and payment step and animates the height between them, instead of switching hard.
 * The outgoing step finishes leaving before the next one mounts, so their Stripe elements never coexist.
 */
export function CheckoutStageTransition({ children, stage }: { children: ReactNode; stage: CheckoutStage }) {
    const reducedMotion = useReducedMotion()
    const contentRef = useRef<HTMLDivElement>(null)
    const [height, setHeight] = useState<number | "auto">("auto")
    const [isResizing, setIsResizing] = useState(false)
    const [isSwitchingStage, setIsSwitchingStage] = useState(false)
    const [previousStage, setPreviousStage] = useState(stage)
    const [direction, setDirection] = useState(1)

    if (stage !== previousStage) {
        setPreviousStage(stage)
        setDirection(STAGE_ORDER[stage] >= STAGE_ORDER[previousStage] ? 1 : -1)
        setIsSwitchingStage(!reducedMotion)
    }

    useLayoutEffect(() => {
        const element = contentRef.current
        if (!element || typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(() => setHeight(element.offsetHeight))
        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    return (
        <motion.div
            initial={false}
            animate={{ height }}
            transition={{ duration: reducedMotion ? 0 : 0.28, ease: EASE }}
            onAnimationStart={() => setIsResizing(true)}
            onAnimationComplete={() => setIsResizing(false)}
            // Clipping only while animating keeps the sliding step from overflowing sideways (which would add a horizontal
            // scrollbar) without cutting off focus rings and shadows at the edges the rest of the time.
            className={isResizing || isSwitchingStage ? "w-full overflow-hidden" : "w-full"}
        >
            <div ref={contentRef}>
                <AnimatePresence mode="wait" initial={false} custom={direction}>
                    <motion.div
                        key={stage}
                        custom={direction}
                        variants={stageVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: reducedMotion ? 0 : 0.16, ease: EASE }}
                        onAnimationComplete={(definition) => {
                            if (definition === "center") setIsSwitchingStage(false)
                        }}
                        className="w-full space-y-6"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    )
}
