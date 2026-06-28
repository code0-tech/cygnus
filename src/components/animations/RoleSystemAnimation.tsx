"use client"

import { Text } from "@code0-tech/pictor"
import { StableBadge } from "../ui/StableBadge"
import { useInView, useReducedMotion } from "motion/react"
import { useEffect, useRef, useState } from "react"
import { Card } from "../ui/Card"

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
    const groupGap = 16
    const velocity = 30

    useEffect(() => {
        const listElement = listRef.current
        if (!listElement) return

        const resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (!entry) return

            setLoopDistance(Math.round(entry.contentRect.height + groupGap))
        })
        resizeObserver.observe(listElement)

        return () => resizeObserver.disconnect()
    }, [roles.length])

    if (!roles.length) return null

    const duration = loopDistance > 0 ? loopDistance / velocity : 0

    const renderRoleCard = (role: RoleItem, index: number) => (
        <Card key={`${role.name}-${role.updatedAt}-${index}`} className="w-full p-3 md:p-5 bg-primary">
            <p className="text-sm text-secondary sm:text-sm">{role.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] leading-5 text-tertiary sm:gap-1.5 sm:text-[11px] sm:leading-5">
                <span>{role.description}</span>
                {role.badges.map((badge) => (
                    <StableBadge key={`${role.name}-${badge}`} color="info" className="align-middle">
                        <Text size="xs" className="text-inherit!">
                            {badge}
                        </Text>
                    </StableBadge>
                ))}
            </div>
        </Card>
    )

    return (
        <div ref={containerRef} className="relative flex h-full w-full cursor-default items-start justify-center overflow-hidden">
            <div
                className="flex flex-col items-center gap-4 will-change-transform"
                style={
                    loopDistance > 0
                        ? {
                              animationName: "role-marquee-up",
                              animationDuration: `${duration}s`,
                              animationTimingFunction: "linear",
                              animationIterationCount: "infinite",
                              animationPlayState: isInView && !prefersReducedMotion ? "running" : "paused",
                          }
                        : undefined
                }
            >
                <div ref={listRef} className="flex flex-col items-center gap-4">
                    {roles.map(renderRoleCard)}
                </div>
                <div className="flex flex-col items-center gap-4" aria-hidden="true">
                    {roles.map((role, index) => renderRoleCard(role, index + roles.length))}
                </div>
            </div>
        </div>
    )
}
