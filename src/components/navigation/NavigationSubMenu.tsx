"use client"

import type { SubNavItem } from "@/lib/navigation"
import { cn } from "@/lib/utils"
import Link from "next/link"
import React from "react"

type NavigationSubMenuProps = {
    items: SubNavItem[]
    onSelect?: (item: SubNavItem) => void
}

const NavigationSubMenu: React.FC<NavigationSubMenuProps> = ({ items, onSelect }) => {
    return (
        <div className="grid min-w-72 grid-cols-1 md:min-w-120 md:grid-cols-2">
            {items.map((subItem, index) => (
                <div key={subItem.key || subItem.title} className={cn(items.length % 2 === 1 && index === items.length - 1 && "md:col-span-2")}>
                    <Link href={subItem.href} onClick={() => onSelect?.(subItem)} className="group flex h-14 items-center gap-2 rounded-xl p-2 hover:bg-white/10 cursor-pointer">
                        <div className="ring ring-transparent group-hover:ring-white/10 rounded-lg bg-white/10 border border-white/20 p-1 text-secondary group-hover:text-white">{subItem.icon}</div>
                        <div className="flex min-w-0 flex-col">
                            <p className="truncate text-white font-semibold tracking-wide">{subItem.title}</p>
                            <p className="truncate text-secondary text-xs">{subItem.description}</p>
                        </div>
                    </Link>
                </div>
            ))}
        </div>
    )
}

export { NavigationSubMenu }
