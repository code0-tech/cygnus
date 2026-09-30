import { STATUS_TONE_BADGE_COLOR, type StatusTone } from "@/components/licenses/statusTone"
import { Badge } from "@code0-tech/pictor"
import type { ReactNode } from "react"

function getStatusTone(status?: string): StatusTone {
    switch (status?.toLowerCase()) {
        case "paid":
            return "brand"
        case "uncollectible":
            return "error"
        case "draft":
        case "void":
            return "muted"
        default:
            return "warning"
    }
}

export function InvoiceStatusBadge({ children, status }: { children: ReactNode; status?: string }) {
    return <Badge color={STATUS_TONE_BADGE_COLOR[getStatusTone(status)]}>{children}</Badge>
}
