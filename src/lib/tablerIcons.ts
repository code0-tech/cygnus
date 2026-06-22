import * as TablerIcons from "@tabler/icons-react"
import { createElement, type ComponentType, type ReactNode } from "react"

export function getTablerIcon(icon: string | null | undefined, size = 24): ReactNode {
    const fallbackIcon = TablerIcons.IconCube as ComponentType<{ size?: number }>
    const normalizedIconName = `Icon${(icon ?? "cube")
        .trim()
        .replace(/^icon/i, "")
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join("")}`

    const resolvedIcon = normalizedIconName in TablerIcons ? (TablerIcons[normalizedIconName as keyof typeof TablerIcons] as unknown as ComponentType<{ size?: number }>) : fallbackIcon

    return createElement(resolvedIcon, { size })
}
