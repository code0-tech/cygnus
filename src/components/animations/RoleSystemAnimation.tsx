"use client"

import { Badge, Card, Text } from "@code0-tech/pictor"
import { animate, m as motion, useInView, useMotionValue, useReducedMotion } from "motion/react"
import { useEffect, useRef, useState } from "react"

interface RoleItem {
    name: string
    description: string
    badges: string[]
    updatedAt: string
}

interface RoleSystemAnimationProps {
    roles: RoleItem[]
}

export function RoleSystemAnimation({ roles }: RoleSystemAnimationProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { amount: 0.2 })
    const prefersReducedMotion = useReducedMotion()
    const [loopDistance, setLoopDistance] = useState(0)
    const y = useMotionValue(0)
    const groupGap = 16

    useEffect(() => {
        const listElement = listRef.current
        if (!listElement) return

        let frame = 0
        let previousDistance = 0

        const updateLoopDistance = () => {
            const nextDistance = Math.round(listElement.getBoundingClientRect().height + groupGap)
            if (nextDistance !== previousDistance) {
                previousDistance = nextDistance
                setLoopDistance(nextDistance)
            }
        }

        updateLoopDistance()

        const resizeObserver = new ResizeObserver(() => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(updateLoopDistance)
        })
        resizeObserver.observe(listElement)

        return () => {
            cancelAnimationFrame(frame)
            resizeObserver.disconnect()
        }
    }, [roles.length])

    useEffect(() => {
        if (!loopDistance || !isInView || prefersReducedMotion) {
            y.set(0)
            return
        }

        const controls = animate(
            y,
            [0, -loopDistance],
            {
                duration: 20,
                ease: "linear",
                repeat: Infinity,
                repeatType: "loop",
            },
        )

        return () => controls.stop()
    }, [isInView, loopDistance, prefersReducedMotion, y])

    if (!roles.length) return null

    const renderRoleCard = (role: RoleItem, index: number) => (
        <Card
            key={`${role.name}-${role.updatedAt}-${index}`}
            className="w-full p-3.5! shadow-md sm:p-4 md:p-5"
        >
            <p className="text-sm text-white/75 sm:text-sm">{role.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] leading-4.5 text-white/60 sm:gap-1.5 sm:text-[11px] sm:leading-5">
                <span>{role.description}</span>
                {role.badges.map((badge) => (
                    <Badge
                        key={`${role.name}-${badge}`}
                        color="info"
                        className="align-middle"
                        suppressHydrationWarning
                    >
                        <Text size="xs" className="text-inherit!">{badge}</Text>
                    </Badge>
                ))}
            </div>
        </Card>
    )

    return (
        <div ref={containerRef} className="relative flex h-full w-full cursor-default items-start justify-center overflow-hidden">
            <motion.div
                className="flex flex-col items-center gap-4 will-change-transform"
                style={{ y }}
            >
                <div ref={listRef} className="flex flex-col items-center gap-4">
                    {roles.map(renderRoleCard)}
                </div>
                <div className="flex flex-col items-center gap-4" aria-hidden="true">
                    {roles.map((role, index) => renderRoleCard(role, index + roles.length))}
                </div>
            </motion.div>
        </div>
    )
}
