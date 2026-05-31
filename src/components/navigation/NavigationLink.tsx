"use client"

import type { NavButton } from "@/lib/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@code0-tech/pictor"
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
            className="w-full lg:w-auto"
            onClick={onClick}
        >
            <Button
                variant={button.variant}
                className={cn(
                    "h-9! w-full! justify-center px-2! lg:w-auto!",
                    button.variant === "filled" && "bg-white/80! hover:bg-white! text-primary!",
                    className
                )}
            >
                {button.icon}
                <span className="lg:hidden xl:inline">{button.title}</span>
            </Button>
        </Link>
    )
}
