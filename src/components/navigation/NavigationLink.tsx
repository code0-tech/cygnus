"use client"

import { cn } from "@/lib/utils"
import { Button } from "@code0-tech/pictor"
import Link from "next/link"
import type { MouseEventHandler, ReactNode } from "react"

type NavigationLinkVariant = "none" | "normal" | "outlined" | "filled"

interface NavigationLinkProps {
    href: string
    title: string
    icon: ReactNode
    newTab: boolean
    variant: NavigationLinkVariant
    className?: string
    onClick?: MouseEventHandler<HTMLAnchorElement>
}

export function NavigationLink({ href, title, icon, newTab, variant, className, onClick }: NavigationLinkProps) {
    return (
        <Link
            href={href}
            target={newTab ? "_blank" : undefined}
            rel={newTab ? "noreferrer" : undefined}
            className="w-full lg:w-auto"
            onClick={onClick}
        >
            <Button
                variant={variant}
                className={cn(
                    "h-9! w-full! justify-center px-2! lg:w-auto!",
                    className
                )}
            >
                {icon}
                <span className="lg:hidden xl:inline">{title}</span>
            </Button>
        </Link>
    )
}
