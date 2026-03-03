"use client"

import { cn } from "@/lib/utils"
import { IconChevronUp } from "@tabler/icons-react"
import { motion } from "motion/react"
import React, { useRef } from "react"
import { fadeInUp, SubNavItem } from "./types"

type TabProps = {
    setPosition: React.Dispatch<React.SetStateAction<{ left: number; width: number; opacity: number }>>
    subMenu?: SubNavItem[]
    activeSubMenu?: SubNavItem[] | null
    onClick: () => void
    onMouseEnter: () => void
    title: string
}

const NavTab: React.FC<TabProps> = ({ setPosition, onClick, title, subMenu, activeSubMenu, onMouseEnter }) => {
    const ref = useRef<HTMLDivElement>(null)
    const hasSubMenu = Boolean(subMenu?.length)
    const active = activeSubMenu && activeSubMenu === subMenu

    return (
        <motion.div
            className={cn("relative z-50 flex items-center gap-2 px-4 py-1 font-medium text-md rounded-xl cursor-pointer", hasSubMenu && "pr-1")}
            ref={ref}
            onClick={onClick}
            initial={fadeInUp.initial}
            animate={fadeInUp.animate}
            transition={fadeInUp.transition}
            onMouseEnter={() => {
                if (!ref?.current) return

                const { width } = ref.current.getBoundingClientRect()

                setPosition({
                    left: ref.current.offsetLeft,
                    width,
                    opacity: 1
                })
                onMouseEnter()
            }}
        >
            {title}
            {hasSubMenu && (
                active ? (
                    <IconChevronUp size={20} className={"transition-all text-white/75 mr-1"}/>
                ) : (
                    <IconChevronUp size={20} className={"rotate-180 transition-all text-white/75 mr-1"}/>
                )
            )}
        </motion.div>
    )
}

export { NavTab }
