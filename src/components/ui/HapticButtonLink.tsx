"use client"

import "@code0-tech/pictor/dist/assets/Button.style.css"
import { cn } from "@/lib/utils"
import Link from "next/link"
import type { ReactNode } from "react"
import { useWebHaptics } from "web-haptics/react"

type ButtonVariant = "none" | "normal" | "outlined" | "filled"

export function buttonLinkClassName(variant: ButtonVariant | null | undefined = "normal", className?: string) {
    return cn(`button button--secondary button--${variant ?? "normal"} button--xs`, "focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-white/60!", className)
}

interface HapticButtonLinkProps {
    href: string
    children: ReactNode
    variant?: ButtonVariant | null
    className?: string
    // Renders a plain anchor for route handlers (e.g. a login start that sets cookies and redirects
    // off-site), which client-side navigation and prefetching must not request.
    reloadDocument?: boolean
}

export function HapticButtonLink({ href, children, variant = "normal", className, reloadDocument = false }: HapticButtonLinkProps) {
    const { trigger } = useWebHaptics()
    const linkClassName = buttonLinkClassName(variant, cn("w-full! sm:w-auto! text-base! z-10", className))
    const handleClick = () => trigger("heavy")

    return reloadDocument ? (
        <a href={href} className={linkClassName} onClick={handleClick}>
            {children}
        </a>
    ) : (
        <Link href={href} className={linkClassName} onClick={handleClick}>
            {children}
        </Link>
    )
}
