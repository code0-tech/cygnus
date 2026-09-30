import type { Color } from "@code0-tech/pictor"

export type StatusTone = "brand" | "error" | "muted" | "warning"

export const STATUS_TONE_DOT_CLASS: Record<StatusTone, string> = {
    brand: "bg-brand",
    error: "bg-error",
    muted: "bg-tertiary",
    warning: "bg-warning",
}

// Pictor's "info" badge uses the brand mint.
export const STATUS_TONE_BADGE_COLOR: Record<StatusTone, Color> = {
    brand: "info",
    error: "error",
    muted: "tertiary",
    warning: "warning",
}
