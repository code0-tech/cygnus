"use client"

import { cn } from "@/lib/utils"
import { Button } from "@code0-tech/pictor"
import Link from "next/link"
import type { ReactNode } from "react"
import { useWebHaptics } from "web-haptics/react"

interface HapticButtonLinkProps {
    href: string
    children: ReactNode
    variant?: "none" | "normal" | "outlined" | "filled" | null
    className?: string
}

export function HapticButtonLink({
    href,
    children,
    variant = "normal",
    className,
}: HapticButtonLinkProps) {
    const { trigger } = useWebHaptics()

    return (
        <Link href={href} className="w-full sm:w-auto">
            <Button
                variant={variant ?? undefined}
                onClick={() => trigger("heavy")}
                className={cn("w-full! text-base! z-10", className)}
            >
                {children}
            </Button>
        </Link>
    )
}
