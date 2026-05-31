"use client"

import { m as motion, useMotionValue, useSpring } from "motion/react"
import React, { forwardRef, useImperativeHandle } from "react"

export interface NavigationCursorHandle {
    moveTo: (element: HTMLElement, container: HTMLElement) => void
    hide: () => void
}

const NavigationCursor = forwardRef<NavigationCursorHandle>((_, ref) => {
    const x = useSpring(useMotionValue(0), { stiffness: 260, damping: 30, mass: 0.9 })
    const opacity = useSpring(useMotionValue(0), { stiffness: 260, damping: 30, mass: 0.9 })
    const width = useSpring(useMotionValue(0), { stiffness: 260, damping: 30, mass: 0.9 })

    useImperativeHandle(ref, () => ({
        moveTo: (element, container) => {
            const elementRect = element.getBoundingClientRect()
            const containerRect = container.getBoundingClientRect()

            x.set(elementRect.left - containerRect.left)
            width.set(elementRect.width)
            opacity.set(1)
        },
        hide: () => {
            opacity.set(0)
        },
    }), [opacity, width, x])

    return (
        <motion.div
            className="absolute z-40 h-8 rounded-[0.75rem] bg-white/10 will-change-transform"
            style={{ x, width, opacity }}
        />
    )
})

NavigationCursor.displayName = "NavigationCursor"

export { NavigationCursor }
