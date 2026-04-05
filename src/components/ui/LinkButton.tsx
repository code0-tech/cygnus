"use client"

import * as React from "react"
import { IconArrowUpRight } from "@tabler/icons-react"
import type { AppLocale } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import Link, { LinkProps } from "next/link"
import { useWebHaptics } from "web-haptics/react"

interface LinkButtonProps extends Omit<LinkProps, "href" | "locale">{
    href: string
    children: React.ReactNode
    showArrow?: boolean
    className?: string
    locale?: AppLocale
}

const baseClassName =
    "w-max h-auto min-w-0 px-0 py-0 text-sm inline-flex items-center justify-center gap-1 border-b border-dashed border-white/25" +
    "rounded-none cursor-pointer text-gray-500 hover:text-brand hover:border-brand transition-colors disabled:opacity-50" +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:pointer-events-none"


export function LinkButton({ className, children, href, showArrow = true, locale, ...props }: LinkButtonProps) {
    const { trigger } = useWebHaptics()
    const localizedHref = href.startsWith("/") ? `/${locale ?? ""}${href}`.replace("//", "/") : href

    return (
        <Link
            href={localizedHref}
            onClick={() => trigger("medium")}
            className={cn(baseClassName, className)}
            {...props}
        >
            <span className="flex items-center gap-1 min-w-0 truncate">{children}</span>
            {showArrow && <IconArrowUpRight size={16} className="shrink-0" />}
        </Link>
    )
}
