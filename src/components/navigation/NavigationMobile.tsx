"use client"

import { cn } from "@/lib/utils"
import { useNavigationScrollState } from "@/hooks/useNavigationScrollState"
import { useNavigationViewModel } from "@/hooks/useNavigationViewModel"
import { useOutsideClick } from "@/hooks/useOutsideClick"
import { type AppLocale } from "@/lib/i18n"
import type { NavbarButtonData } from "@/lib/navigation"
import type { NavbarItem } from "@/payload-types"
import { Container } from "@code0-tech/pictor"
import { IconMenu2, IconX } from "@tabler/icons-react"
import { AnimatePresence, m as motion } from "motion/react"
import Image from "next/image"
import Link from "next/link"
import React, { useEffect, useRef, useState } from "react"
import { useWebHaptics } from "web-haptics/react"
import { NavigationLink } from "./NavigationLink"
import { NavigationMobileItem } from "./NavigationMobileItem"

type NavigationMobileProps = {
    locale: AppLocale
    items: NavbarItem[]
    buttons: NavbarButtonData[]
}

const NavigationMobile: React.FC<NavigationMobileProps> = ({ locale, items, buttons }) => {
    const { trigger } = useWebHaptics()
    const menuRef = useOutsideClick<HTMLElement>(() => setIsOpen(false))
    const wasOpenRef = useRef(false)
    const [isOpen, setIsOpen] = useState(false)
    const [mobileOpenKey, setMobileOpenKey] = useState<string | null>(null)
    const [isMenuClosing, setIsMenuClosing] = useState(false)
    const { homeHref, navbarItems, navbarButtons } = useNavigationViewModel(locale, items, buttons)
    const menuTransition = {
        duration: 0.24,
        ease: [0.22, 1, 0.36, 1] as const,
    }
    const isShellExpanded = isOpen || isMenuClosing
    const isScrolled = useNavigationScrollState({
        onScroll: () => setIsOpen((prevIsOpen) => (prevIsOpen ? false : prevIsOpen)),
    })

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout> | undefined

        if (isOpen) {
            setIsMenuClosing(false)
        } else if (wasOpenRef.current) {
            setIsMenuClosing(true)
            timeoutId = setTimeout(() => setIsMenuClosing(false), 320)
        }

        wasOpenRef.current = isOpen

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId)
            }
        }
    }, [isOpen])

    const closeMenu = () => {
        trigger("medium")
        setIsOpen(false)
        setMobileOpenKey(null)
    }

    return (
        <header
            className={cn(
                "fixed z-50 w-full overflow-hidden border-b transition-[padding,background-color,border-color,backdrop-filter] duration-200 ease-out",
                (isScrolled || isShellExpanded)
                    ? "border-white/10 bg-primary/50 pt-1 backdrop-blur-lg"
                    : "border-transparent bg-transparent pt-3"
            )}
            ref={menuRef}
        >
            <Container>
                <div className={cn("relative transition-[padding] duration-200 ease-out", (isScrolled || isShellExpanded) ? "py-2" : "py-4")}>
                    <div className="relative z-10 flex flex-col overflow-hidden">
                        <div className={"w-full flex items-center justify-between gap-2"}>
                            <Link
                                href={homeHref}
                                onClick={() => {
                                    trigger("medium")
                                    setIsOpen(false)
                                }}
                            >
                                <div className="flex">
                                    <Image src={"/code0_logo_white.png"} width={"32"} height={"32"} alt={"Code0 Logo"} loading="eager"/>
                                </div>
                            </Link>
                            <button
                                type="button"
                                className="mr-1.5 border-0 bg-transparent transition-all"
                                aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
                                aria-expanded={isOpen}
                                aria-controls="mobile-navigation-menu"
                                onClick={() => {
                                    trigger("medium")
                                    setIsOpen(!isOpen)
                                }}
                            >
                                {isOpen ? <IconX className="text-white/75"/> : <IconMenu2 className="text-white/75"/>}
                            </button>
                        </div>
                        <AnimatePresence initial={false}>
                            {isOpen && (
                                <motion.div
                                    id="mobile-navigation-menu"
                                    key="mobile-menu"
                                    layout
                                    initial={{ opacity: 0, y: -6, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: "auto" }}
                                    exit={{ opacity: 0, y: -6, height: 0 }}
                                    transition={{
                                        ...menuTransition,
                                        delay: isScrolled ? 0.08 : 0,
                                    }}
                                    style={{ overflow: "hidden" }}
                                    className="flex flex-col gap-2 pt-3"
                                >
                                    <div className="flex flex-col gap-1">
                                        {navbarItems.map((item) => {
                                            const isOpenAcc = mobileOpenKey === item.title

                                            return (
                                                <NavigationMobileItem
                                                    key={item.title}
                                                    item={item}
                                                    isOpen={isOpenAcc}
                                                    onToggle={() => {
                                                        trigger("soft")
                                                        setMobileOpenKey(isOpenAcc ? null : item.title)
                                                    }}
                                                    onNavigate={closeMenu}
                                                />
                                            )
                                        })}
                                        <div className="mt-4 w-full flex flex-col items-center gap-2 pb-2">
                                            {navbarButtons.map((button) => (
                                                <NavigationLink
                                                    key={`${button.title}-${button.href}`}
                                                    button={button}
                                                    className="text-base!"
                                                    onClick={closeMenu}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </Container>
        </header>
    )
}

export { NavigationMobile }
