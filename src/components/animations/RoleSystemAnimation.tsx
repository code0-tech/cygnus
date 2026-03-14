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

export function RoleSystemAnimation({ roles }: RoleSystemAnimationProps) {
    const loopRoles = [...roles, ...roles]

    return (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden cursor-default">
            <motion.div
                className="flex flex-col items-center gap-4"
                animate={{ y: ["0%", "-50%"] }}
                transition={{
                    duration: 20,
                    ease: "linear",
                    repeat: Number.POSITIVE_INFINITY,
                }}
            >
                {loopRoles.map((role, index) => (
                    <Card
                        key={`${role.name}-${index}`}
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
                ))}
            </motion.div>
        </div>
    )
}
