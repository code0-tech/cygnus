"use client"

import { cn } from "@/lib/utils"
import { IconChevronUp } from "@tabler/icons-react"
import { motion } from "motion/react"
import Link from "next/link"
import React, { useRef } from "react"
import { fadeInUp, SubNavItem } from "./types"

type TabProps = {
    setPosition: React.Dispatch<React.SetStateAction<{ left: number; width: number; opacity: number }>>
    href: string | null
    subMenu?: SubNavItem[]
    activeSubMenu?: SubNavItem[] | null
    onMouseEnter: () => void
    title: string
    disableIntroAnimation: boolean
}

const NavTab: React.FC<TabProps> = ({ setPosition, href, title, subMenu, activeSubMenu, onMouseEnter, disableIntroAnimation }) => {
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
            initial={disableIntroAnimation ? false : fadeInUp.initial}
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
            {href ? (
                <Link href={href} className={interactiveClassName}>
                    {title}
                    {hasSubMenu && (
                        active ? (
                            <IconChevronUp size={20} className={"transition-all text-white/75 mr-1"}/>
                        ) : (
                            <IconChevronUp size={20} className={"rotate-180 transition-all text-white/75 mr-1"}/>
                        )
                    )}
                </Link>
            ) : (
                <button type="button" className={interactiveClassName}>
                    {title}
                    {hasSubMenu && (
                        active ? (
                            <IconChevronUp size={20} className={"transition-all text-white/75 mr-1"}/>
                        ) : (
                            <IconChevronUp size={20} className={"rotate-180 transition-all text-white/75 mr-1"}/>
                        )
                    )}
                </button>
            )}
        </motion.div>
    )
}

export { NavTab }
