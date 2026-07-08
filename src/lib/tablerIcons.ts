import "server-only"

import { createIconResolver } from "@mvriu5/payload-icon-picker"
import { simpleIconsAdapter } from "@mvriu5/payload-icon-picker/adapters/simple-icons"
import { tablerIconAdapter } from "@mvriu5/payload-icon-picker/adapters/tabler"
import * as SimpleIcons from "@icons-pack/react-simple-icons"
import * as TablerIcons from "@tabler/icons-react"
import { createElement, type CSSProperties, type Key, type ReactNode } from "react"

const iconResolverIcons = [
    ...tablerIconAdapter(TablerIcons),
    ...tablerIconAdapter(TablerIcons, { prefix: "tabler" }),
    ...simpleIconsAdapter(SimpleIcons),
    ...simpleIconsAdapter(SimpleIcons, { prefix: "si" }),
]

const resolveStoredIcon = createIconResolver({
    icons: iconResolverIcons,
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
    const normalizedIcon = icon?.trim()
    const candidateValues = [
        normalizedIcon,
        normalizedIcon?.startsWith("tabler:") ? `tabler:${toPayloadIconName(normalizedIcon.slice("tabler:".length))}` : undefined,
        normalizedIcon?.startsWith("si:") ? `si:${toSimpleIconName(normalizedIcon.slice("si:".length))}` : undefined,
        toPayloadIconName(icon),
        toSimpleIconName(icon),
        "IconCube",
    ]
    const resolvedIcon = candidateValues.map((candidate) => resolveStoredIcon(candidate)).find((candidate) => Boolean(candidate?.svg))
    const iconSizeStyle = { "--icon-size": `${size}px` } as CSSProperties

    if (!resolvedIcon?.svg) return null

    return createElement("span", {
        key,
        "aria-hidden": true,
        className: "inline-flex size-(--icon-size) shrink-0 [&>svg]:size-full",
        dangerouslySetInnerHTML: { __html: resolvedIcon.svg },
        style: iconSizeStyle,
    })
}
