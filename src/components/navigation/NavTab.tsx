"use client"

import { fadeInUp, type SubNavItem } from "@/lib/navigation"
import { cn } from "@/lib/utils"
import { IconChevronUp } from "@tabler/icons-react"
import { m as motion } from "motion/react"
import Link from "next/link"
import React, { useRef } from "react"

type TabProps = {
    setPosition: (position: { left: number; width: number; opacity: number }) => void
    containerRef: React.RefObject<HTMLDivElement | null>
    href: string | null
    subMenu?: SubNavItem[]
    activeSubMenu?: SubNavItem[] | null
    onMouseEnter: () => void
    title: string
}

const NavTab: React.FC<TabProps> = ({ setPosition, containerRef, href, title, subMenu, activeSubMenu, onMouseEnter }) => {
    const ref = useRef<HTMLDivElement>(null)
    const hasSubMenu = Boolean(subMenu?.length)
    const active = activeSubMenu && activeSubMenu === subMenu
    const interactiveClassName = cn(
        "relative z-50 flex items-center gap-2 px-4 py-1 font-medium text-md rounded-xl cursor-pointer",
        hasSubMenu && "pr-1"
    )

    return (
        <motion.div
            className="relative z-50"
            ref={ref}
            initial={false}
            animate={fadeInUp.animate}
            transition={fadeInUp.transition}
            onMouseEnter={() => {
                if (!ref.current || !containerRef.current) return

                const tabRect = ref.current.getBoundingClientRect()
                const containerRect = containerRef.current.getBoundingClientRect()

                setPosition({
                    left: tabRect.left - containerRect.left,
                    width: tabRect.width,
                    opacity: 1
                })
                onMouseEnter()
            }}
        >
            {href ? (
                <Link href={href} className={interactiveClassName}>
                    {title}
                    {hasSubMenu &&
                        <IconChevronUp size={20} className={cn("mr-1 text-white/75 transition-transform", active && "rotate-180")}/>
                    }
                </Link>
            ) : (
                <button type="button" className={interactiveClassName}>
                    {title}
                    {hasSubMenu &&
                        <IconChevronUp size={20} className={cn("mr-1 text-white/75 transition-transform", active && "rotate-180")}/>
                    }
                </button>
            )}
        </motion.div>
    )
}

export { NavTab }
