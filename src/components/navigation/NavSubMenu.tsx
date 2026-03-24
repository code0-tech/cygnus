"use client"

import type { SubNavItem } from "@/lib/navigation"
import { cn } from "@/lib/utils"
import { m as motion } from "motion/react"
import Link from "next/link"
import React from "react"

type NavSubMenuProps = {
    items: SubNavItem[]
    onSelect?: (item: SubNavItem) => void
}

const NavSubMenu: React.FC<NavSubMenuProps> = ({ items, onSelect }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2">
            {items.map((subItem, index) => (
                <motion.div
                    key={subItem.title}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className={cn(items.length % 2 === 1 && index === items.length - 1 && "md:col-span-2")}
                >
                    <Link
                        href={subItem.href}
                        onClick={() => onSelect?.(subItem)}
                        className="group h-14 flex items-center p-2 hover:bg-white/10 cursor-pointer gap-2 rounded-lg">
                        <div className="p-1 border border-dashed border-white/20 text-gray-400 rounded-lg group-hover:text-white group-hover:border-white/60">
                            {subItem.icon}
                        </div>
                        <div className="flex flex-col">
                            <p className="text-white font-medium">{subItem.title}</p>
                            <p className="text-white/75 text-xs">{subItem.description}</p>
                        </div>
                    </Link>
                </motion.div>
            ))}
        </div>
    )
}

export { NavSubMenu }
