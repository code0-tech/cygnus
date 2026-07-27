"use client"

import { ANIMATION_PRESETS, cn, type AnimationPreset } from "@/lib/utils"
import { m as motion } from "motion/react"
import { type ReactNode, useEffect, useRef } from "react"

export interface SectionAnimation {
    preset?: AnimationPreset
    delay?: number
    duration?: number
    once?: boolean
    viewportAmount?: number
    viewportMargin?: string
}

interface SectionMotionProps {
    animation?: SectionAnimation
    children: ReactNode
    className?: string
    fullHeight?: boolean
}

export function SectionMotion({ animation = {}, children, className, fullHeight = false }: SectionMotionProps) {
    const { preset = "fade-up", delay = 0, duration, once = true, viewportAmount = 0.2, viewportMargin } = animation
    const sectionRef = useRef<HTMLElement | null>(null)
    const animationConfig = preset === "none" ? null : ANIMATION_PRESETS[preset]

    useEffect(() => {
        const section = sectionRef.current
        if (!section) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry) return

                section.dataset.inView = String(entry.isIntersecting)
                if (entry.isIntersecting && once) {
                    observer.unobserve(section)
                }
            },
            { rootMargin: "100px" }
        )

        observer.observe(section)
        return () => observer.disconnect()
    }, [once])

    return (
        <motion.section
            ref={sectionRef}
            data-in-view="false"
            className={cn("group/section relative flex flex-col gap-16 overflow-hidden", fullHeight && "h-[200dvh] md:h-[min(100dvh,1080px)]", className)}
            initial={animationConfig?.initial}
            whileInView={animationConfig?.whileInView}
            viewport={animationConfig ? { once, amount: viewportAmount, margin: viewportMargin } : undefined}
            transition={
                animationConfig
                    ? {
                          ...animationConfig.transition,
                          delay,
                          duration: duration ?? animationConfig.transition.duration,
                      }
                    : undefined
            }
        >
            {children}
        </motion.section>
    )
}
