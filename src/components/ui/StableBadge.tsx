import { cn } from "@/lib/utils"
import type { CSSProperties, ReactNode } from "react"

type StableBadgeColor = "primary" | "secondary" | "tertiary" | "success" | "warning" | "error" | "info"
type Rgba = { r: number, g: number, b: number, a: number }

interface StableBadgeProps {
    children: ReactNode
    color?: StableBadgeColor | string
    border?: boolean
    className?: string
    style?: CSSProperties
}

const namedColors: Record<string, string> = {
    primary: "#070514",
    secondary: "#191825",
    tertiary: "#201e2c",
    success: "#29bf12",
    warning: "#ffbe0b",
    error: "#d90429",
    info: "#70ffb2",
}

const badgeClassMap: Record<StableBadgeColor, string> = {
    primary: "bg-[#070514] text-[#bfbfbfbf] shadow-[inset_0_1px_1px_#bfbfbf1a]",
    secondary: "bg-[#191825] text-[#bfbfbfbf] shadow-[inset_0_1px_1px_#bfbfbf1a]",
    tertiary: "bg-[#201e2c] text-[#ffffffbf] shadow-[inset_0_1px_1px_#ffffff1a]",
    success: "bg-[#0a1814] text-[#29bf12bf] shadow-[inset_0_1px_1px_#29bf121a]",
    warning: "bg-[#201813] text-[#ffbe0bbf] shadow-[inset_0_1px_1px_#ffbe0b1a]",
    error: "bg-[#1c0516] text-[#d90429bf] shadow-[inset_0_1px_1px_#d904291a]",
    info: "bg-[#121e24] text-[#70ffb2bf] shadow-[inset_0_1px_1px_#70ffb21a]",
}

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)

const parseHexColor = (color: string): Rgba | null => {
    const hex = color.slice(1)

    if (hex.length === 3) {
        return {
            r: Number.parseInt(`${hex[0]}${hex[0]}`, 16),
            g: Number.parseInt(`${hex[1]}${hex[1]}`, 16),
            b: Number.parseInt(`${hex[2]}${hex[2]}`, 16),
            a: 1,
        }
    }

    if (hex.length === 4) {
        return {
            r: Number.parseInt(`${hex[0]}${hex[0]}`, 16),
            g: Number.parseInt(`${hex[1]}${hex[1]}`, 16),
            b: Number.parseInt(`${hex[2]}${hex[2]}`, 16),
            a: Number.parseInt(`${hex[3]}${hex[3]}`, 16) / 255,
        }
    }

    if (hex.length === 6 || hex.length === 8) {
        return {
            r: Number.parseInt(hex.slice(0, 2), 16),
            g: Number.parseInt(hex.slice(2, 4), 16),
            b: Number.parseInt(hex.slice(4, 6), 16),
            a: hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1,
        }
    }

    return null
}

const parseRgbColor = (color: string): Rgba | null => {
    const match = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i)
    if (!match) return null

    return {
        r: Math.round(Number(match[1])),
        g: Math.round(Number(match[2])),
        b: Math.round(Number(match[3])),
        a: match[4] !== undefined ? Number(match[4]) : 1,
    }
}

const parseColorToRgba = (color: string): Rgba => {
    const normalized = namedColors[color] ?? color

    if (normalized.startsWith("#")) {
        return parseHexColor(normalized) ?? { r: 0, g: 0, b: 0, a: 1 }
    }

    if (normalized.startsWith("rgb")) {
        return parseRgbColor(normalized) ?? { r: 0, g: 0, b: 0, a: 1 }
    }

    return { r: 0, g: 0, b: 0, a: 1 }
}

const mixColorRgb = (color: string, level: number) => {
    const weight = clamp01(level * 0.1)
    const source = parseColorToRgba(color)
    const base = parseColorToRgba("#070514")
    const mix = (a: number, b: number) => Math.round(a * (1 - weight) + b * weight)

    return `rgb(${mix(source.r, base.r)}, ${mix(source.g, base.g)}, ${mix(source.b, base.b)})`
}

const withAlpha = (color: string, alpha: number) => {
    const parsed = parseColorToRgba(color)
    return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${clamp01(alpha)})`
}

const isStableBadgeColor = (color: string): color is StableBadgeColor => color in badgeClassMap

export function StableBadge({
    children,
    color = "primary",
    border = false,
    className,
    style,
}: StableBadgeProps) {

    return (
        <span
            className={cn(
                "inline-flex h-fit w-fit items-center gap-[0.35rem] rounded-2xl px-[0.35rem] py-[0.1166666667rem] align-middle font-[Inter,sans-serif] text-[0.7rem] font-normal tracking-[-0.5px]",
                "bg-(--badge-color-background) text-(--badge-color) shadow-[inset_0_1px_1px_0_var(--badge-color-border)]",
                "box-border",
                isStableBadgeColor(color) && badgeClassMap[color],
                !border && "border-none!",
                className,
            )}
            style={{
                ...style,
                ["--badge-color-background" as string]: mixColorRgb(color, 9),
                ["--badge-color-border" as string]: withAlpha(color, 0.1),
                ["--badge-color" as string]: withAlpha(color, 0.75),
            }}
        >
            {children}
        </span>
    )
}
