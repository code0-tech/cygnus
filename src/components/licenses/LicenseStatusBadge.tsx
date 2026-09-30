import { getLicenseStatusTone } from "@/components/licenses/LicenseStatusDot"
import { STATUS_TONE_BADGE_COLOR } from "@/components/licenses/statusTone"
import { Badge } from "@code0-tech/pictor"
import type { ReactNode } from "react"

export function LicenseStatusBadge({ children, status }: { children: ReactNode; status?: string }) {
    return <Badge color={STATUS_TONE_BADGE_COLOR[getLicenseStatusTone(status)]}>{children}</Badge>
}
