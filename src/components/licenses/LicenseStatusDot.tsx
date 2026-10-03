import { STATUS_TONE_DOT_CLASS, type StatusTone } from "@/components/licenses/statusTone"
import { cn } from "@/lib/utils"
import type { HTMLAttributes } from "react"

function normalizeStatus(status?: string) {
    return status?.trim().toLowerCase().replaceAll("-", "_")
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
            return "muted"
        default:
            return "warning"
    }
}

interface LicenseStatusDotProps extends HTMLAttributes<HTMLSpanElement> {
    status?: string
}

export function LicenseStatusDot({ className, status, ...props }: LicenseStatusDotProps) {
    return <span {...props} className={cn("size-1.5 shrink-0 rounded-full", STATUS_TONE_DOT_CLASS[getLicenseStatusTone(status)], className)} />
}
