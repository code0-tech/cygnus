"use client"

import { buttonLinkClassName } from "@/components/ui/HapticButtonLink"
import type { NavButton } from "@/lib/navigation"
import { cn } from "@/lib/utils"
import Link from "next/link"
import type { MouseEventHandler } from "react"

interface NavigationLinkProps {
    button: NavButton
    className?: string
    onClick?: MouseEventHandler<HTMLAnchorElement>
}

export function NavigationLink({ button, className, onClick }: NavigationLinkProps) {
    return (
        <Link
            href={button.href}
            target={button.newTab ? "_blank" : undefined}
            rel={button.newTab ? "noreferrer" : undefined}
            onClick={onClick}
            className={buttonLinkClassName(
                button.variant,
                cn("h-9! w-full! justify-center px-2! lg:w-auto!", button.variant === "filled" && "bg-white/80! hover:bg-white! text-primary!", className)
            )}
        >
            {button.icon}
            {/* Between lg and xl only the icon is visible; keep the title available to screen readers. */}
            <span className="lg:sr-only xl:not-sr-only">{button.title}</span>
        </Link>
    )
}
