"use client"

import * as React from "react"
import { IconArrowUpRight } from "@tabler/icons-react"
import type { AppLocale } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import Link, { LinkProps } from "next/link"
import { useWebHaptics } from "web-haptics/react"

interface LinkButtonProps extends Omit<LinkProps, "href" | "locale"> {
    href: string
    children: React.ReactNode
    showArrow?: boolean
    className?: string
    locale?: AppLocale
}

const linkButtonClassName =
    "group/link relative w-max h-auto min-w-0 px-0 py-0 text-sm inline-flex items-center justify-center gap-1 tracking-normal" +
    " rounded-none cursor-pointer text-tertiary hover:text-brand transition-colors disabled:opacity-50" +
    " after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-current after:transition-[width] after:duration-300 after:ease-out hover:after:w-full" +
    " focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:pointer-events-none"

export function LinkButton({ className, children, href, showArrow = true, locale, ...props }: LinkButtonProps) {
    const { trigger } = useWebHaptics()

    const isString = typeof href === "string"
    const localizedHref = isString && href.startsWith("/") ? `/${locale ?? ""}${href}`.replace("//", "/") : (href ?? "")

    return (
        <Link href={localizedHref} onClick={() => trigger("medium")} className={cn(linkButtonClassName, className)} {...props}>
            <span className="flex items-center gap-1 min-w-0 truncate">{children}</span>
            {showArrow && <IconArrowUpRight size={16} className="shrink-0 group-hover/link:text-brand" />}
        </Link>
    )
}
