import { cn } from "@/lib/utils"
import { IconCloud, IconCloudComputing, IconServer } from "@tabler/icons-react"
import { useId } from "react"

type DeploymentImageColor = "aqua" | "pink" | "brand"
type DeploymentImageIcon = "cloud" | "server" | "cloud-computing"

interface DeploymentImageProps {
    color: DeploymentImageColor
    icon: DeploymentImageIcon
    text: string
}

const palette: Record<DeploymentImageColor, { stroke: string, glow: string, chip: string }> = {
    aqua: {
        stroke: "var(--text-aqua)",
        glow: "bg-[radial-gradient(ellipse_at_center,rgba(122,203,255,0.2)_0%,rgba(122,203,255,0.1)_25%,transparent_70%)]",
        chip: "text-aqua",
    },
    pink: {
        stroke: "var(--text-pink)",
        glow: "bg-[radial-gradient(ellipse_at_center,rgba(248,114,226,0.2)_0%,rgba(248,114,226,0.1)_25%,transparent_70%)]",
        chip: "text-pink",
    },
    brand: {
        stroke: "var(--text-brand)",
        glow: "bg-[radial-gradient(ellipse_at_center,rgba(145,232,120,0.2)_0%,rgba(145,232,120,0.1)_25%,transparent_70%)]",
        chip: "text-brand",
    },
}

const icons = {
    cloud: IconCloud,
    server: IconServer,
    "cloud-computing": IconCloudComputing,
} satisfies Record<DeploymentImageIcon, typeof IconCloud>

export function DeploymentImage({ color, icon, text }: DeploymentImageProps) {
    const accent = palette[color]
    const gradientId = useId()
    const Icon = icons[icon]

    return (
        <div className="relative overflow-hidden rounded-[1.2rem] border border-white/8 bg-primary/40">
            <div
                className={cn("absolute inset-x-[6%] -top-1/2 h-full rounded-full", accent.glow)}
                aria-hidden="true"
            />

            <div className="relative aspect-[243.476/160] w-full px-5 py-4">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 243.476 160"
                    className="absolute inset-0 h-full w-full p-4"
                    aria-hidden="true"
                >
                    <defs>
                        <linearGradient id={`${gradientId}-left`} x1="5.036" y1="80" x2="121.738" y2="80" gradientUnits="userSpaceOnUse">
                            <stop offset="0" stopColor={accent.stroke} stopOpacity="0" />
                            <stop offset="0.5" stopColor={accent.stroke} />
                            <stop offset="1" stopColor={accent.stroke} />
                        </linearGradient>
                        <linearGradient id={`${gradientId}-right`} x1="238.439" y1="80" x2="121.738" y2="80" gradientUnits="userSpaceOnUse">
                            <stop offset="0" stopColor={accent.stroke} stopOpacity="0" />
                            <stop offset="0.5" stopColor={accent.stroke} />
                            <stop offset="1" stopColor={accent.stroke} />
                        </linearGradient>
                    </defs>
                    <path
                        d="M5.036 31.856h20.441c6.988 0 12.653 5.665 12.653 12.653v22.838c0 6.988 5.665 12.653 12.653 12.653h70.956"
                        fill="none"
                        stroke={`url(#${gradientId}-left)`}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={4}
                    />
                    <path
                        d="M238.439 31.856h-20.441c-6.988 0-12.653 5.665-12.653 12.653v22.838c0 6.988-5.665 12.653-12.653 12.653h-70.956"
                        fill="none"
                        stroke={`url(#${gradientId}-right)`}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={4}
                    />
                    <path
                        d="M5.036 128.144h20.441c6.988 0 12.653-5.665 12.653-12.653v-22.838c0-6.988 5.665-12.653 12.653-12.653h70.956"
                        fill="none"
                        stroke={`url(#${gradientId}-left)`}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={4}
                    />
                    <path
                        d="M238.439 128.144h-20.441c-6.988 0-12.653-5.665-12.653-12.653v-22.838c0-6.988-5.665-12.653-12.653-12.653h-70.956"
                        fill="none"
                        stroke={`url(#${gradientId}-right)`}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={4}
                    />
                </svg>
                <div className="relative flex h-full items-center justify-center">
                    <div className="relative size-24 overflow-hidden flex items-center justify-center rounded-2xl border border-white/10 bg-linear-to-br from-[#0f0b27] to-[#252342] shadow-[0_14px_40px_rgba(0,0,0,0.28)]">
                        <Icon
                            aria-hidden="true"
                            stroke={2}
                            className={cn(
                                "pointer-events-none absolute left-4 top-4 size-16 opacity-5",
                                accent.chip,
                            )}
                        />
                        <span
                            className={cn(
                                "relative z-10 inline-flex font-semibold tracking-wider text-sm",
                                accent.chip,
                            )}
                        >
                            {text}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
