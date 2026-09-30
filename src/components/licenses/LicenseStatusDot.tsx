import { STATUS_TONE_BADGE_COLOR, STATUS_TONE_DOT_CLASS, type StatusTone } from "@/components/licenses/statusTone"
import { cn } from "@/lib/utils"
import { Badge } from "@code0-tech/pictor"
import type { HTMLAttributes, ReactNode } from "react"

function normalizeStatus(status?: string) {
    return status?.trim().toLowerCase().replaceAll("-", "_")
}

export function isLicenseStatusError(status?: string) {
    return normalizeStatus(status) === "payment_failed"
}

function getStatusTone(status?: string): StatusTone {
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
    return <span {...props} className={cn("size-1.5 shrink-0 rounded-full", STATUS_TONE_DOT_CLASS[getStatusTone(status)], className)} />
}

export function LicenseStatusBadge({ children, status }: { children: ReactNode; status?: string }) {
    return <Badge color={STATUS_TONE_BADGE_COLOR[getStatusTone(status)]}>{children}</Badge>
}
