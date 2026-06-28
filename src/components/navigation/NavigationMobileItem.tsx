"use client"

import { navigationMenuTriggerStyle } from "@/components/ui/NavigationMenu"
import { NavItem } from "@/lib/navigation"
import { cn } from "@/lib/utils"
import { IconChevronUp } from "@tabler/icons-react"
import { AnimatePresence, m as motion } from "motion/react"
import Link from "next/link"
import { useLayoutEffect, useRef, useState } from "react"
import { NavigationSubMenu } from "./NavigationSubMenu"

interface NavigationMobileItemProps {
    item: NavItem
    isOpen: boolean
    onToggle: () => void
    onNavigate: () => void
}

const mobileNavItemClassName = navigationMenuTriggerStyle({
    className: "h-auto w-full justify-between px-4 py-2 text-left text-base text-secondary hover:text-white focus:text-white",
})

export function NavigationMobileItem({ item, isOpen, onToggle, onNavigate }: NavigationMobileItemProps) {
    const submenuContentRef = useRef<HTMLDivElement>(null)
    const [submenuHeight, setSubmenuHeight] = useState(0)
    const isAccordion = Boolean(item.subMenu?.length)
    const hasRoute = Boolean(item.href)

    useLayoutEffect(() => {
        const element = submenuContentRef.current

        if (!element || !isOpen) {
            setSubmenuHeight(0)
            return
        }

        const measure = () => {
            setSubmenuHeight(element.scrollHeight)
        }

        measure()

        const resizeObserver = new ResizeObserver(measure)
        resizeObserver.observe(element)

        return () => resizeObserver.disconnect()
    }, [isOpen, item.subMenu])

    return (
        <div className="flex flex-col">
            {isAccordion ? (
                <button type="button" className={cn(mobileNavItemClassName, isOpen && "bg-white/10 text-white")} onClick={onToggle}>
                    <span>{item.title}</span>
                    <IconChevronUp size={20} className={cn("transition-transform text-secondary", !isOpen && "rotate-180")} />
                </button>
            ) : (
                <Link href={item.href ?? "#"} className={cn(mobileNavItemClassName, !hasRoute && "pointer-events-none opacity-60")} onClick={onNavigate}>
                    <span>{item.title}</span>
                </Link>
            )}

            {isAccordion && (
                <AnimatePresence initial={false}>
                    {isOpen && (
                        <motion.div
                            key={`${item.title}-submenu`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: submenuHeight, opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                                height: {
                                    duration: 0.24,
                                    ease: [0.22, 1, 0.36, 1],
                                },
                                opacity: {
                                    duration: 0.16,
                                    ease: "easeOut",
                                },
                            }}
                            className="overflow-hidden"
                        >
                            <div ref={submenuContentRef} className="mt-1 rounded-lg">
                                <NavigationSubMenu items={item.subMenu!} onSelect={onNavigate} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    )
}
