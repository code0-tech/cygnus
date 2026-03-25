"use client"

import type { AppLocale } from "@/lib/i18n"
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
    locale?: AppLocale
}

export function HapticButtonLink({
    href,
    children,
    variant = "normal",
    className,
    locale,
}: HapticButtonLinkProps) {
    const { trigger } = useWebHaptics()
    const localizedHref = href.startsWith("/") ? `/${locale ?? ""}${href}`.replace("//", "/") : href

    return (
        <Link href={localizedHref} className="w-full sm:w-auto">
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
