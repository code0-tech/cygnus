import "server-only"

import { IconRenderer as PayloadIconRenderer } from "@mvriu5/payload-icon-picker/client"
import type { CSSProperties, Key, ReactNode } from "react"
import { simpleIconsAdapter } from "@mvriu5/payload-icon-picker/adapters/simple-icons"
import { tablerIconAdapter } from "@mvriu5/payload-icon-picker/adapters/tabler"
import * as SimpleIcons from "@icons-pack/react-simple-icons"
import * as TablerIcons from "@tabler/icons-react"

type IconRendererProps = {
    size?: number
    value: string | null | undefined
}

const ICON_CLASS_NAME = "inline-flex size-(--icon-size) shrink-0 [&>svg]:size-full"

export const iconRendererIcons = [...tablerIconAdapter(TablerIcons, { prefix: "tabler" }), ...simpleIconsAdapter(SimpleIcons, { prefix: "si" })]

export function IconRenderer({ size = 24, value }: IconRendererProps): ReactNode {
    const iconSizeStyle = { "--icon-size": `${size}px` } as CSSProperties
    const normalizedValue = value?.trim() || "tabler:IconCube"

    const fallback =
        normalizedValue === "tabler:IconCube" ? null : <PayloadIconRenderer className={ICON_CLASS_NAME} icons={iconRendererIcons} size={size} style={iconSizeStyle} value="tabler:IconCube" />

    return <PayloadIconRenderer className={ICON_CLASS_NAME} fallback={fallback} icons={iconRendererIcons} size={size} style={iconSizeStyle} value={normalizedValue} />
}

export function getIcon(icon: string | null | undefined, size = 24, key?: Key): ReactNode {
    return <IconRenderer key={key} size={size} value={icon} />
}
