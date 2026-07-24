"use client"

import { Icon } from "@code0-tech/pictor"

interface ActionIconProps {
    icon: string | null | undefined
    size?: number | string
}

export function ActionIcon({ icon, size = 24 }: ActionIconProps) {
    if (!icon) return null

    return <Icon icon={icon} size={size} />
}
