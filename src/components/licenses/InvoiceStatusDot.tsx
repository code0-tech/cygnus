import { cn } from "@/lib/utils"
import type { HTMLAttributes } from "react"

function getStatusColor(status?: string) {
    switch (status?.toLowerCase()) {
        case "paid":
            return "bg-brand"
        case "uncollectible":
            return "bg-error"
        case "draft":
        case "void":
            return "bg-tertiary"
        default:
            return "bg-warning"
    }
}

interface InvoiceStatusDotProps extends HTMLAttributes<HTMLSpanElement> {
    status?: string
}

export function InvoiceStatusDot({ className, status, ...props }: InvoiceStatusDotProps) {
    return <span {...props} className={cn("size-1.5 shrink-0 rounded-full", getStatusColor(status), className)} />
}
