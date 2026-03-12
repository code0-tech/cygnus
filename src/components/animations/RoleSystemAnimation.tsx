"use client"

import { Badge, Card, Text } from "@code0-tech/pictor"
import { motion } from "motion/react"

interface RoleItem {
    name: string
    description: string
    badges: string[]
    updatedAt: string
}

interface RoleSystemAnimationProps {
    roles: RoleItem[]
}

function RoleRow({
    roles,
    direction,
}: {
    roles: RoleItem[]
    direction: "left" | "right"
}) {
    const loopRoles = [...roles, ...roles]

    return (
        <motion.div
            className="flex w-max items-start gap-4"
            animate={direction === "left" ? { x: ["0%", "-50%"] } : { x: ["-50%", "0%"] }}
            transition={{
                duration: 18,
                ease: "linear",
                repeat: Number.POSITIVE_INFINITY,
            }}
        >
            {loopRoles.map((role, index) => (
                <Card
                    key={`${direction}-${role.name}-${index}`}
                    className="w-80 shadow-md"
                >
                    <p className="text-sm font-semibold text-white/92">{role.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] leading-5 text-white/60">
                        <span>{role.description}</span>
                        {role.badges.map((badge) => (
                            <Badge
                                key={`${role.name}-${badge}`}
                                color="info"
                                className="align-middle"
                                suppressHydrationWarning
                            >
                                <Text size="xs" style={{color: "inherit"}}>{badge}</Text>
                            </Badge>
                        ))}
                    </div>
                </Card>
            ))}
        </motion.div>
    )
}

export function RoleSystemAnimation({ roles }: RoleSystemAnimationProps) {
    const splitIndex = Math.ceil(roles.length / 2)
    const topRowRoles = roles.slice(0, splitIndex)
    const bottomRowRoles = roles.slice(splitIndex)

    return (
        <div className="relative flex h-full flex-col justify-center gap-3 overflow-hidden">
            <div className="pointer-events-none absolute left-0 inset-y-0 z-10 w-16 bg-linear-to-r from-primary via-primary/75 to-transparent" />
            <div className="pointer-events-none absolute right-0 inset-y-0 z-10 w-16 bg-linear-to-l from-primary via-primary/75 to-transparent" />
            <div className="relative">
                <RoleRow roles={topRowRoles} direction="left" />
            </div>
            <div className="relative pl-10">
                <RoleRow roles={bottomRowRoles} direction="right" />
            </div>
        </div>
    )
}
