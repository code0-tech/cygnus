"use client"

import { Text } from "@code0-tech/pictor"
import { StableBadge } from "../ui/StableBadge"
import { useInView, useReducedMotion } from "motion/react"
import { useEffect, useRef } from "react"
import { Card } from "../ui/Card"

interface RoleItem {
    id: string
    name: string
    description: string
    badges: string[]
    updatedAt: string
}

interface RoleSystemAnimationProps {
    roles: RoleItem[]
}

function renderRoleCard(role: RoleItem, copy: "primary" | "duplicate") {
    return (
        <Card key={`${copy}-${role.id}`} className="w-full p-3 md:p-5 bg-primary">
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
}

export function RoleSystemAnimation({ roles }: RoleSystemAnimationProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const animationRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { amount: 0.2 })
    const prefersReducedMotion = useReducedMotion()
    const groupGap = 16
    const velocity = 30

    useEffect(() => {
        const listElement = listRef.current
        if (!listElement) return

        const resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (!entry) return

            const loopDistance = Math.round(entry.contentRect.height + groupGap)
            if (animationRef.current) {
                animationRef.current.style.animationDuration = `${loopDistance / velocity}s`
            }
        })
        resizeObserver.observe(listElement)

        return () => resizeObserver.disconnect()
    }, [])

    if (!roles.length) return null

    return (
        <div ref={containerRef} className="relative flex h-full w-full cursor-default items-start justify-center overflow-hidden">
            <div
                ref={animationRef}
                className="flex flex-col items-center gap-4 will-change-transform"
                style={{
                    animationName: "role-marquee-up",
                    animationDuration: "0s",
                    animationTimingFunction: "linear",
                    animationIterationCount: "infinite",
                    animationPlayState: isInView && !prefersReducedMotion ? "running" : "paused",
                }}
            >
                <div ref={listRef} className="flex flex-col items-center gap-4">
                    {roles.map((role) => renderRoleCard(role, "primary"))}
                </div>
                <div className="flex flex-col items-center gap-4" aria-hidden="true">
                    {roles.map((role) => renderRoleCard(role, "duplicate"))}
                </div>
            </div>
        </div>
    )
}
