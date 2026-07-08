import "server-only"

import { createIconResolver } from "@mvriu5/payload-icon-picker"
import * as SimpleIcons from "@icons-pack/react-simple-icons"
import { icons as tablerIcons } from "@tabler/icons-react"
import type { ComponentType } from "react"
import { createElement, type Key, type ReactNode } from "react"

type IconComponent = ComponentType<{
    size?: number
    "aria-hidden"?: boolean
    focusable?: boolean
}>
type IconResolverConfig = Parameters<typeof createIconResolver>[0]

const prefixedTablerIcons = Object.fromEntries(Object.entries(tablerIcons).map(([name, Icon]) => [`tabler:${name}`, Icon]))
const prefixedSimpleIcons = Object.fromEntries(
    Object.entries(SimpleIcons)
        .filter(([, Icon]) => typeof Icon === "object" || typeof Icon === "function")
        .map(([name, Icon]) => [`si:${name}`, Icon])
)

const resolveStoredIcon = createIconResolver({
    icons: {
        ...tablerIcons,
        ...prefixedTablerIcons,
        ...prefixedSimpleIcons,
    } as unknown as IconResolverConfig["icons"],
    resolveIcon: ({ name }) => name,
})

function toPascalIconName(icon: string | null | undefined) {
    return (icon ?? "")
        .trim()
        .split(/[\s_:-]+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join("")
}

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

function toSimpleIconName(icon: string | null | undefined) {
    const normalized = (icon ?? "").trim()
    if (/^si[A-Z0-9]/.test(normalized)) return normalized

    const simpleIconName = `Si${toPascalIconName(normalized).replace(/^Si/i, "")}`
    return simpleIconName === "Si" ? "SiGithub" : simpleIconName
}

export function getTablerIcon(icon: string | null | undefined, size = 24, key?: Key): ReactNode {
    const fallbackIcon = tablerIcons.IconCube as IconComponent
    const normalizedIcon = icon?.trim()
    const resolvedIcon =
        resolveStoredIcon(normalizedIcon)?.Icon ??
        (normalizedIcon?.startsWith("tabler:") ? resolveStoredIcon(`tabler:${toPayloadIconName(normalizedIcon.slice("tabler:".length))}`)?.Icon : undefined) ??
        (normalizedIcon?.startsWith("si:") ? resolveStoredIcon(`si:${toSimpleIconName(normalizedIcon.slice("si:".length))}`)?.Icon : undefined) ??
        resolveStoredIcon(toPayloadIconName(icon))?.Icon ??
        fallbackIcon

    return createElement(resolvedIcon as IconComponent, { key, size, "aria-hidden": true })
}
