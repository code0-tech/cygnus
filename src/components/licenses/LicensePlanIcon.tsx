import { IconRocket, IconSettings, IconSparkles, IconStack2 } from "@tabler/icons-react"

interface LicensePlanIconProps {
    className?: string
    plan?: string
    size?: number
}

export function LicensePlanIcon({ className, plan, size = 18 }: LicensePlanIconProps) {
    const iconProps = { "aria-hidden": true, className, size } as const

    switch (plan?.toLowerCase()) {
        case "pro":
            return <IconSparkles {...iconProps} />
        case "max":
            return <IconRocket {...iconProps} />
        case "custom":
            return <IconSettings {...iconProps} />
        default:
            return <IconStack2 {...iconProps} />
    }
}
