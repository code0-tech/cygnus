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
    // Renders a plain anchor for route handlers (e.g. a login start that sets cookies and redirects
    // off-site), which client-side navigation and prefetching must not request.
    reloadDocument?: boolean
}

export function HapticButtonLink({ href, children, variant = "normal", className, reloadDocument = false }: HapticButtonLinkProps) {
    const { trigger } = useWebHaptics()

    const button = (
        <Button variant={variant ?? undefined} onClick={() => trigger("heavy")} className={cn("w-full! text-base! z-10", className)}>
            {children}
        </Button>
    )

    return reloadDocument ? (
        <a href={href} className="w-full sm:w-auto">
            {button}
        </a>
    ) : (
        <Link href={href} className="w-full sm:w-auto">
            {button}
        </Link>
    )
}
