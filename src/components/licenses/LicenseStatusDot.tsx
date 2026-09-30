import { STATUS_TONE_DOT_CLASS, type StatusTone } from "@/components/licenses/statusTone"
import { cn } from "@/lib/utils"
import type { HTMLAttributes } from "react"

function normalizeStatus(status?: string) {
    return status?.trim().toLowerCase().replaceAll("-", "_")
}

export function isLicenseStatusError(status?: string) {
    return normalizeStatus(status) === "payment_failed"
}

export function getLicenseStatusTone(status?: string): StatusTone {
    switch (normalizeStatus(status)) {
        case "active":
        case "paid":
            return "brand"
        case "payment_failed":
            return "error"
        case "canceled":
        case "expired":
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
