"use client"

import { cn } from "@/lib/utils"
import { useNavigationScrollState } from "@/hooks/useNavigationScrollState"
import { useNavigationViewModel } from "@/hooks/useNavigationViewModel"
import { useOutsideClick } from "@/hooks/useOutsideClick"
import { type AppLocale } from "@/lib/i18n"
import type { NavigationLogoData, NavbarButtonData, NavbarItemData } from "@/lib/navigation"
import { Container } from "@code0-tech/pictor"
import { IconMenu2, IconX } from "@tabler/icons-react"
import { AnimatePresence, m as motion } from "motion/react"
import Image from "next/image"
import Link from "next/link"
import React, { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useWebHaptics } from "web-haptics/react"
import { NavigationLink } from "./NavigationLink"
import { NavigationMobileItem } from "./NavigationMobileItem"

type NavigationMobileProps = {
    locale: AppLocale
    items: NavbarItemData[]
    buttons: NavbarButtonData[]
    logo?: NavigationLogoData
}

const NavigationMobile: React.FC<NavigationMobileProps> = ({ locale, items, buttons, logo }) => {
    const { trigger } = useWebHaptics()
    const menuRef = useOutsideClick<HTMLElement>(() => setIsOpen(false))
    const rootRef = useRef<HTMLDivElement>(null)
    const wasOpenRef = useRef(false)
    const [isOpen, setIsOpen] = useState(false)
    const [mobileOpenKey, setMobileOpenKey] = useState<string | null>(null)
    const [isMenuClosing, setIsMenuClosing] = useState(false)
    const [shellInsetWidth, setShellInsetWidth] = useState(0)
    const { homeHref, navbarItems, navbarButtons, logo: navigationLogo } = useNavigationViewModel(locale, items, buttons, logo)
    const menuTransition = {
        duration: 0.34,
        ease: [0.16, 1, 0.3, 1] as const,
    }
    const shellTransition = {
        duration: 0.46,
        ease: [0.16, 1, 0.3, 1] as const,
    }
    const isShellExpanded = isOpen || isMenuClosing
    const isScrolled = useNavigationScrollState({
        onScroll: () => setIsOpen((prevIsOpen) => (prevIsOpen ? false : prevIsOpen)),
    })
    const expandedHeaderPadding = 8
    const shellInset = isScrolled && !isShellExpanded ? shellInsetWidth : 0
    const headerInlinePadding = isShellExpanded
        ? expandedHeaderPadding
        : isScrolled
          ? shellInsetWidth
          : 0
    const headerRightPadding = isShellExpanded
        ? expandedHeaderPadding
        : isScrolled
          ? shellInsetWidth + expandedHeaderPadding
          : 0

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout> | undefined

        if (isOpen) {
            setIsMenuClosing(false)
        } else if (wasOpenRef.current) {
            setIsMenuClosing(true)
            timeoutId = setTimeout(() => setIsMenuClosing(false), 460)
        }

        wasOpenRef.current = isOpen

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId)
            }
        }
    }, [isOpen])

    useLayoutEffect(() => {
        const element = rootRef.current

        if (!element) {
            setShellInsetWidth(0)
            return
        }

        const measure = () => {
            setShellInsetWidth(element.clientWidth * 0.1)
        }

        measure()

        const resizeObserver = new ResizeObserver(measure)
        resizeObserver.observe(element)

        return () => resizeObserver.disconnect()
    }, [])

    const closeMenu = () => {
        trigger("medium")
        setIsOpen(false)
        setMobileOpenKey(null)
    }

    return (
        <header
            className="fixed z-50 w-full overflow-hidden pt-3"
            ref={menuRef}
        >
            <Container>
                <div ref={rootRef} className="relative my-6">
                    <motion.div
                        className={cn(
                            "pointer-events-none absolute inset-0 rounded-2xl shadow-sm",
                            (isScrolled || isShellExpanded) ? "bg-primary/50 backdrop-blur-lg" : "bg-transparent shadow-none",
                        )}
                        initial={false}
                        animate={{
                            left: shellInset,
                            right: shellInset,
                        }}
                        transition={shellTransition}
                    />
                    <motion.div
                        className="pointer-events-none absolute inset-0 z-10 rounded-2xl border border-white/5"
                        initial={false}
                        animate={{
                            left: shellInset,
                            right: shellInset,
                            opacity: isScrolled || isShellExpanded ? 1 : 0,
                        }}
                        transition={shellTransition}
                    />
                    <motion.div
                        className="relative z-10 flex flex-col overflow-hidden rounded-2xl p-1.5"
                        initial={false}
                    >
                        <motion.div
                            className={"w-full flex items-center justify-between gap-2"}
                            initial={false}
                            animate={{
                                paddingLeft: headerInlinePadding,
                                paddingRight: headerRightPadding,
                            }}
                            transition={shellTransition}
                        >
                            <Link
                                href={homeHref}
                                onClick={() => {
                                    trigger("medium")
                                    setIsOpen(false)
                                }}
                            >
                                <div className="flex">
                                    <NavigationLogo logo={navigationLogo} />
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
                        </motion.div>
                        <AnimatePresence initial={false}>
                            {isOpen && (
                                <motion.div
                                    id="mobile-navigation-menu"
                                    key="mobile-menu"
                                    layout
                                    initial={{ opacity: 0, y: -4, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: "auto" }}
                                    exit={{ opacity: 0, y: -4, height: 0 }}
                                    transition={menuTransition}
                                    style={{ overflow: "hidden" }}
                                    className="flex flex-col gap-2 px-2"
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
                    </motion.div>
                </div>
            </Container>
        </header>
    )
}

export { NavigationMobile }

function NavigationLogo({ logo }: { logo?: NavigationLogoData }) {
    if (logo && typeof logo !== "number" && logo.url) {
        return (
            <Image
                src={logo.url}
                width={32}
                height={32}
                alt={logo.alt ?? "Code0 Logo"}
                loading="eager"
                className="size-8 object-contain"
            />
        )
    }

    return <Image src="/code0_logo_white.png" width={32} height={32} alt="Code0 Logo" loading="eager"/>
}
