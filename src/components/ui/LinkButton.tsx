"use client"

import * as React from "react"
import { IconArrowUpRight } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import Link, { LinkProps } from "next/link"
import { useWebHaptics } from "web-haptics/react"

interface LinkButtonProps extends LinkProps {
    href: string
    children: React.ReactNode
    className?: string
}

const baseClassName = cn(
    "w-max h-auto px-0 py-0 text-sm inline-flex items-center justify-center gap-1 border-b border-dashed border-white/25",
    "rounded-none cursor-pointer text-gray-500 hover:text-brand hover:border-brand transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:pointer-events-none",
    "disabled:opacity-50",
)

export function LinkButton({ className, children, href, ...props }: LinkButtonProps) {
    const { trigger } = useWebHaptics()

    return (
        <Link
            href={href}
            onClick={() => trigger("medium")}
            className={cn(baseClassName, className)}
            {...props}
        >
            {children}
            <IconArrowUpRight size={16} />
        </Link>
    )
}
