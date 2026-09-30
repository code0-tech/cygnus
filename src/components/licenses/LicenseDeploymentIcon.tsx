import { IconCloud, IconServer } from "@tabler/icons-react"

interface LicenseDeploymentIconProps {
    className?: string
    deploymentType?: string
    size?: number
}

export function LicenseDeploymentIcon({ className, deploymentType, size = 16 }: LicenseDeploymentIconProps) {
    const iconProps = { "aria-hidden": true, className, size } as const

    return deploymentType === "self_hosted" ? <IconServer {...iconProps} /> : <IconCloud {...iconProps} />
}
