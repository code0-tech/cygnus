"use client"

import { NavItem } from "@/lib/navigation"
import { cn } from "@/lib/utils"
import { IconChevronUp } from "@tabler/icons-react"
import { m as motion } from "motion/react"
import Link from "next/link"
import { useId, useLayoutEffect, useRef, useState } from "react"
import { NavigationSubMenu } from "./NavigationSubMenu"

interface NavigationMobileItemProps {
    item: NavItem
    isOpen: boolean
    onToggle: () => void
    onNavigate: () => void
}

export function NavigationMobileItem({ item, isOpen, onToggle, onNavigate }: NavigationMobileItemProps) {
    const submenuId = useId()
    const triggerId = useId()
    const triggerRef = useRef<HTMLButtonElement>(null)
    const submenuContentRef = useRef<HTMLDivElement>(null)
    const [submenuHeight, setSubmenuHeight] = useState(0)
    const isAccordion = Boolean(item.subMenuGroups?.length || item.shortLinkGroups?.length)
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
    }, [isOpen, item.subMenuGroups, item.shortLinkGroups])

    return (
        <div
            className="flex flex-col"
            onKeyDown={(event) => {
                if (event.key !== "Escape" || !isOpen) return

                event.preventDefault()
                event.stopPropagation()
                onToggle()
                triggerRef.current?.focus()
            }}
        >
            {isAccordion ? (
                <button
                    ref={triggerRef}
                    id={triggerId}
                    aria-expanded={isOpen}
                    aria-controls={submenuId}
                    type="button"
                    className={cn(
                        "group/navigation-menu-trigger inline-flex h-auto w-full items-center justify-between rounded-xl px-4 py-2 text-left text-base font-medium text-secondary outline-none transition-colors hover:bg-light hover:text-white focus:bg-light focus:text-white disabled:pointer-events-none disabled:opacity-50 data-popup-open:bg-light data-open:bg-light",
                        isOpen && "bg-light text-white"
                    )}
                    onClick={onToggle}
                >
                    <span>{item.title}</span>
                    <IconChevronUp aria-hidden="true" size={20} className={cn("transition-transform text-secondary", !isOpen && "rotate-180")} />
                </button>
            ) : (
                <Link
                    href={item.href ?? "#"}
                    className={cn(
                        "group/navigation-menu-trigger inline-flex h-auto w-full items-center justify-between rounded-xl px-4 py-2 text-left text-base font-medium text-secondary outline-none transition-colors hover:bg-light hover:text-white focus:bg-light focus:text-white disabled:pointer-events-none disabled:opacity-50 data-popup-open:bg-light data-open:bg-light",
                        !hasRoute && "pointer-events-none opacity-60"
                    )}
                    onClick={onNavigate}
                >
                    <span>{item.title}</span>
                </Link>
            )}

            {isAccordion && (
                <motion.div
                    id={submenuId}
                    role="region"
                    aria-labelledby={triggerId}
                    aria-hidden={!isOpen}
                    inert={!isOpen}
                    initial={false}
                    animate={{ height: isOpen ? submenuHeight : 0, opacity: isOpen ? 1 : 0 }}
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
                        <NavigationSubMenu groups={item.subMenuGroups} shortLinkGroups={item.shortLinkGroups} onSelect={onNavigate} />
                    </div>
                </motion.div>
            )}
        </div>
    )
}
