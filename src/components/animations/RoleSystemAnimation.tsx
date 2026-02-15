"use client"

import { motion } from "motion/react"

interface RoleItem {
    name: string
    scope: string
    assign: string
}

interface RoleSystemAnimationProps {
    roles: RoleItem[]
}

export function RoleSystemAnimation({ roles }: RoleSystemAnimationProps) {
    const loopRoles = [...roles, ...roles]

    return (
        <div className="overflow-hidden">
            <motion.div
                className="flex w-max items-stretch gap-2"
                animate={{ x: ["-50%", "0%"] }}
                transition={{
                    duration: 7,
                    ease: "linear",
                    repeat: Number.POSITIVE_INFINITY,
                }}
            >
                {loopRoles.map((role, index) => (
                    <div
                        key={`${role.name}-${index}`}
                        className="min-w-32 rounded-md bg-primary ring-1 ring-white/5 px-2.5 py-2"
                    >
                        <p className="truncate text-xs font-medium text-white/90">{role.name}</p>
                        <p className="truncate text-[11px] text-white/55">{role.scope}</p>
                        <p className="mt-1 truncate text-[11px] text-pink">{role.assign}</p>
                    </div>
                ))}
            </motion.div>
        </div>
    )
}
