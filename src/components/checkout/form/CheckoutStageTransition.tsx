"use client"

import type { CheckoutStage } from "@/components/checkout/state/CheckoutStageProvider"
import { m as motion, useReducedMotion, type TargetAndTransition } from "motion/react"
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"

const STAGE_ORDER: Record<CheckoutStage, number> = { billingAddress: 0, payment: 1 }
const EASE = [0.22, 1, 0.36, 1] as const
const STAGE_OFFSET_PX = 16

interface CheckoutStageTransitionProps {
    billing: ReactNode
    payment: ReactNode
    stage: CheckoutStage
}

/**
 * Cross-fades between the billing and payment step and animates the height between them, instead of switching hard.
 * The outgoing step finishes leaving before the next one shows. Forward slides the next step in from the right, going
 * back from the left.
 *
 * The billing step stays mounted once shown and is only hidden on the payment step: the checkout SDK cannot prefill its
 * TaxIdElement, so unmounting it would lose the tax ID and business name, and the mounted elements are what Stripe
 * submits on confirm. The payment step mounts only while it is shown.
 */
export function CheckoutStageTransition({ billing, payment, stage }: CheckoutStageTransitionProps) {
    const reducedMotion = useReducedMotion()
    const contentRef = useRef<HTMLDivElement>(null)
    const [height, setHeight] = useState<number | "auto">("auto")
    const [isResizing, setIsResizing] = useState(false)
    const [isSwitchingStage, setIsSwitchingStage] = useState(false)
    const [previousStage, setPreviousStage] = useState(stage)
    const [displayedStage, setDisplayedStage] = useState(stage)
    const [direction, setDirection] = useState(1)
    const [isBillingMounted, setIsBillingMounted] = useState(stage === "billingAddress")

    if (stage !== previousStage) {
        setPreviousStage(stage)
        setDirection(STAGE_ORDER[stage] >= STAGE_ORDER[previousStage] ? 1 : -1)
        setIsSwitchingStage(!reducedMotion)
        if (reducedMotion) setDisplayedStage(stage)
    }
    if (displayedStage === "billingAddress" && !isBillingMounted) setIsBillingMounted(true)

    useLayoutEffect(() => {
        const element = contentRef.current
        if (!element || typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(() => setHeight(element.offsetHeight))
        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    const duration = reducedMotion ? 0 : 0.16
    const isLeaving = stage !== displayedStage
    const enter: TargetAndTransition = { opacity: 0, x: direction * STAGE_OFFSET_PX, transition: { duration: 0 } }
    const target = (step: CheckoutStage): TargetAndTransition => (step !== displayedStage ? enter : isLeaving ? { opacity: 0, x: direction * -STAGE_OFFSET_PX } : { opacity: 1, x: 0 })

    // Timed rather than driven by animation callbacks, which never fire when motion features are not loaded.
    useEffect(() => {
        if (!isLeaving) return
        const timer = window.setTimeout(() => setDisplayedStage(stage), duration * 1000)
        return () => window.clearTimeout(timer)
    }, [duration, isLeaving, stage])

    useEffect(() => {
        if (!isSwitchingStage || isLeaving) return
        const timer = window.setTimeout(() => setIsSwitchingStage(false), duration * 1000)
        return () => window.clearTimeout(timer)
    }, [duration, isLeaving, isSwitchingStage])

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
                {isBillingMounted && (
                    <motion.div
                        initial={false}
                        animate={target("billingAddress")}
                        transition={{ duration, ease: EASE }}
                        hidden={displayedStage !== "billingAddress"}
                        inert={displayedStage !== "billingAddress" || isLeaving}
                        className="w-full space-y-6"
                    >
                        {billing}
                    </motion.div>
                )}
                {displayedStage === "payment" && (
                    <motion.div
                        // Only read on mount: a step shown on first render appears without sliding in.
                        initial={isSwitchingStage ? enter : false}
                        animate={target("payment")}
                        transition={{ duration, ease: EASE }}
                        inert={isLeaving}
                        className="w-full space-y-6"
                    >
                        {payment}
                    </motion.div>
                )}
            </div>
        </motion.div>
    )
}
