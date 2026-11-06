import { cn } from "@/lib/utils"
import type { Color } from "@code0-tech/pictor"
import type { HTMLAttributes } from "react"

type StatusTone = "brand" | "error" | "canceled" | "warning"

export const LICENSE_STATUS_ERROR_BADGE_COLOR = "#ff4d5e"
const LICENSE_STATUS_CANCELED_COLOR = "#ff8c42"

const statusToneDotClass: Record<StatusTone, string> = {
    brand: "bg-brand",
    error: "bg-error",
    canceled: "bg-[#ff8c42]",
    warning: "bg-warning",
}

const statusToneBadgeColor: Record<StatusTone, Color | string> = {
    brand: "info",
    error: LICENSE_STATUS_ERROR_BADGE_COLOR,
    canceled: LICENSE_STATUS_CANCELED_COLOR,
    warning: "warning",
}

function normalizeStatus(status?: string) {
    return status?.trim().toLowerCase().replaceAll("-", "_")
}

export function isLicenseStatusActive(status?: string) {
    return ["active", "trialing"].includes(normalizeStatus(status) ?? "")
}

export function isLicenseStatusCanceled(status?: string) {
    return ["canceled", "incomplete_expired"].includes(normalizeStatus(status) ?? "")
}

export function isLicenseStatusError(status?: string) {
    return ["past_due", "unpaid"].includes(normalizeStatus(status) ?? "")
}

export function getLicenseStatusTone(status?: string): StatusTone {
    switch (normalizeStatus(status)) {
        case "active":
        case "trialing":
            return "brand"
        case "past_due":
        case "unpaid":
            return "error"
        case "canceled":
        case "incomplete_expired":
            return "canceled"
        default:
            return "warning"
    }
}

export function getLicenseStatusBadgeColor(status?: string) {
    return statusToneBadgeColor[getLicenseStatusTone(status)]
}

interface LicenseStatusDotProps extends HTMLAttributes<HTMLSpanElement> {
    status?: string
}

export function LicenseStatusDot({ className, status, ...props }: LicenseStatusDotProps) {
    return <span {...props} className={cn("size-1.5 shrink-0 rounded-full", statusToneDotClass[getLicenseStatusTone(status)], className)} />
}
