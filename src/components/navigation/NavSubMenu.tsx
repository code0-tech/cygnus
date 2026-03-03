"use client"

import { cn } from "@/lib/utils"
import { motion } from "motion/react"
import React from "react"
import { SubNavItem } from "./types"

type NavSubMenuProps = {
    items: SubNavItem[]
    onSelect: (item: SubNavItem) => void
    variant?: "overlay" | "inline"
}

const NavSubMenu: React.FC<NavSubMenuProps> = ({ items, onSelect, variant = "overlay" }) => {
    const colorClassMap: Record<string, string> = {
        brand: "group-hover:bg-brand/10 group-hover:border-brand/50 group-hover:text-brand",
        yellow: "group-hover:bg-yellow/10 group-hover:border-yellow/50 group-hover:text-yellow",
        aqua: "group-hover:bg-aqua/10 group-hover:border-aqua/50 group-hover:text-aqua",
        blue: "group-hover:bg-blue/10 group-hover:border-blue/50 group-hover:text-blue",
        pink: "group-hover:bg-pink/10 group-hover:border-pink/50 group-hover:text-pink"
    }

    return (
        <>
            {items.map((subItem) => (
                <motion.div
                    key={subItem.title}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => onSelect(subItem)}
                    className={cn(
                        "group h-14 flex items-center p-2 hover:bg-white/10 cursor-pointer",
                        variant === "overlay" ? "gap-3 rounded-md" : "gap-1 rounded-lg"
                    )}
                >
                    <div
                        className={cn(
                            "p-1 border border-dashed border-white/20 text-gray-400 rounded-lg",
                            colorClassMap[subItem.color ?? "brand"] ?? colorClassMap.brand
                        )}
                    >
                        {subItem.icon}
                    </div>
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
