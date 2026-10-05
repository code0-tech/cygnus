import { cn } from "@/lib/utils"
import type { CSSProperties, ReactNode } from "react"

type StableBadgeColor =
    | "primary"
    | "secondary"
    | "tertiary"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "neutral"
    | "brand"
    | "aqua"
    | "blue"
    | "pink"
    | "yellow"
    | "lime"
    | "magenta"
type Rgba = { r: number; g: number; b: number; a: number }

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
    neutral: "#ffffff",
    brand: "oklch(0.9018 0.165 157.04)",
    yellow: "oklch(0.9391 0.1483 106.03)",
    aqua: "oklch(0.7991 0.1074 233.93)",
    blue: "oklch(0.6232 0.1948 279.8)",
    pink: "oklch(0.7477 0.2075 334.16)",
    magenta: "oklch(0.7321 0.2231 319.1)",
    lime: "oklch(0.9332 0.1813 127.46)",
}

const badgeClassMap: Record<StableBadgeColor, string> = {
    primary: "bg-[#070514] text-[#bfbfbfbf]",
    secondary: "bg-[#191825] text-[#bfbfbfbf]",
    tertiary: "bg-[#201e2c] text-[#ffffffbf]",
    success: "bg-[#0a1814] text-[#29bf12bf]",
    warning: "bg-[#201813] text-[#ffbe0bbf]",
    error: "bg-[#1c0516] text-[#d90429bf]",
    info: "bg-[#121e24] text-[#70ffb2bf]",
    neutral: "bg-white/10 text-white",
    brand: "bg-brand/10 text-brand",
    aqua: "bg-aqua/10 text-aqua",
    blue: "bg-blue/10 text-blue",
    pink: "bg-pink/10 text-pink",
    yellow: "bg-yellow/10 text-yellow",
    lime: "bg-lime/10 text-lime",
    magenta: "bg-magenta/10 text-magenta",
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

const parseOklchColor = (color: string): Rgba | null => {
    const match = color.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/i)
    if (!match) return null

    const lightness = Number(match[1])
    const chroma = Number(match[2])
    const hue = (Number(match[3]) * Math.PI) / 180
    const alpha = match[4] === undefined ? 1 : Number(match[4])
    const a = chroma * Math.cos(hue)
    const b = chroma * Math.sin(hue)
    const l = Math.pow(lightness + 0.3963377774 * a + 0.2158037573 * b, 3)
    const m = Math.pow(lightness - 0.1055613458 * a - 0.0638541728 * b, 3)
    const s = Math.pow(lightness - 0.0894841775 * a - 1.291485548 * b, 3)
    const toSrgb = (value: number) => {
        const gammaCorrected = value <= 0.0031308 ? 12.92 * value : 1.055 * Math.pow(value, 1 / 2.4) - 0.055
        return Math.round(clamp01(gammaCorrected) * 255)
    }

    return {
        r: toSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
        g: toSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
        b: toSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
        a: clamp01(alpha),
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

    if (normalized.startsWith("oklch")) {
        return parseOklchColor(normalized) ?? { r: 0, g: 0, b: 0, a: 1 }
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

export function StableBadge({ children, color = "primary", border = false, className, style }: StableBadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex h-fit w-fit items-center gap-[0.35rem] rounded-2xl px-[0.35rem] py-[0.1166666667rem] align-middle font-[Inter,sans-serif] text-[0.7rem] font-normal tracking-[-0.5px]",
                "bg-(--badge-color-background) text-(--badge-color)",
                "box-border shadow-[inset_0_1px_1px_#bfbfbf1a]",
                isStableBadgeColor(color) && badgeClassMap[color],
                !border && "border-none!",
                className
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
