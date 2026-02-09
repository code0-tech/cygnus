"use client"

import { cn } from "@/utils/cn"
import { motion } from "motion/react"
import React from "react"
import { SubNavItem } from "./types"

type NavSubMenuProps = {
    items: SubNavItem[]
    onSelect: (item: SubNavItem) => void
    variant?: "overlay" | "inline"
}

const NavSubMenu: React.FC<NavSubMenuProps> = ({ items, onSelect, variant = "overlay" }) => {
    return (
        <>
            {items.map((subItem) => (
                <motion.div
                    key={subItem.title}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                        "group h-14 flex items-center p-2 hover:bg-white/10 cursor-pointer",
                        variant === "overlay" ? "gap-3 rounded-md" : "gap-1 rounded-lg"
                    )}
                    onClick={() => onSelect(subItem)}
                >
                    <div className="p-1 border border-dashed border-white/20 group-hover:bg-brand/10 group-hover:border-brand/50 text-gray-400 group-hover:text-brand rounded-lg">{subItem.icon}</div>
                    <div className="flex flex-col">
                        <p className="text-white font-medium">{subItem.title}</p>
                        <p className="text-white/75 text-sm">{subItem.description}</p>
                    </div>
                </motion.div>
            ))}
        </>
    )
}

export { NavSubMenu }
