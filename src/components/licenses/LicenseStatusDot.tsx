import { cn } from "@/lib/utils"
import type { HTMLAttributes } from "react"

function normalizeStatus(status?: string) {
    return status?.trim().toLowerCase().replaceAll("-", "_")
}

export function isLicenseStatusError(status?: string) {
    return normalizeStatus(status) === "payment_failed"
}

function getStatusColor(status?: string) {
    switch (normalizeStatus(status)) {
        case "active":
        case "paid":
            return "bg-brand"
        case "payment_failed":
            return "bg-error"
        case "canceled":
        case "expired":
            return "bg-tertiary"
        default:
            return "bg-warning"
    }
}

interface LicenseStatusDotProps extends HTMLAttributes<HTMLSpanElement> {
    status?: string
}

export function LicenseStatusDot({ className, status, ...props }: LicenseStatusDotProps) {
    return <span {...props} className={cn("size-1.5 shrink-0 rounded-full", getStatusColor(status), className)} />
}
