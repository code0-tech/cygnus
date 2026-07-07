import "server-only"

import { createIconResolver } from "@mvriu5/payload-icon-picker"
import { icons as tablerIcons } from "@tabler/icons-react"
import type { ComponentType } from "react"
import { createElement, type Key, type ReactNode } from "react"

type IconComponent = ComponentType<{
    size?: number
    "aria-hidden"?: boolean
    focusable?: boolean
}>
type IconResolverConfig = Parameters<typeof createIconResolver>[0]

const resolveStoredIcon = createIconResolver({
    icons: tablerIcons as unknown as IconResolverConfig["icons"],
    resolveIcon: ({ name }) => name,
})

function toPayloadIconName(icon: string | null | undefined) {
    const normalizedIconName = `Icon${(icon ?? "cube")
        .trim()
        .replace(/^icon/i, "")
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join("")}`

    return normalizedIconName === "Icon" ? "IconCube" : normalizedIconName
}

export function getTablerIcon(icon: string | null | undefined, size = 24, key?: Key): ReactNode {
    const fallbackIcon = tablerIcons.IconCube as IconComponent
    const resolvedIcon = resolveStoredIcon(icon)?.Icon ?? resolveStoredIcon(toPayloadIconName(icon))?.Icon ?? fallbackIcon

    return createElement(resolvedIcon as IconComponent, { key, size, "aria-hidden": true })
}
