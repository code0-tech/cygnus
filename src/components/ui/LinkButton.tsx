import * as React from "react"
import { IconArrowUpRight } from "@tabler/icons-react"
import { cn } from "@/utils/cn"
import Link from "next/link"

interface LinkButtonProps extends  React.ButtonHTMLAttributes<HTMLButtonElement> {
    href: string
    children: React.ReactNode
    className?: string
}

const baseClassName = cn(
    "h-auto px-0 py-0 text-sm inline-flex items-center justify-center gap-1 border-b border-dashed border-white/25",
    "rounded-none cursor-pointer text-gray-500 hover:text-brand hover:border-brand transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:pointer-events-none",
    "disabled:opacity-50",
)

export function LinkButton({ className, children, href, ...props }: LinkButtonProps) {
    return (
        <Link href={href}>
            <button
                type={"button"}
                className={cn(baseClassName, className)}
                {...props}
            >
                {children}
                <IconArrowUpRight size={16} />
            </button>
        </Link>
    )
}
