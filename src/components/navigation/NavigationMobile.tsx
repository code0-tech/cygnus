"use client"

import { cn } from "@/lib/utils"
import { useNavigationScrollState } from "@/hooks/useNavigationScrollState"
import { useOutsideClick } from "@/hooks/useOutsideClick"
import type { NavButton, NavItem, NavigationLogoData } from "@/lib/navigation"
import { Container } from "@code0-tech/pictor"
import { IconMenu2, IconX } from "@tabler/icons-react"
import { AnimatePresence, m as motion } from "motion/react"
import Image from "next/image"
import Link from "next/link"
import React, { useEffect, useLayoutEffect, useReducer, useRef } from "react"
import { useWebHaptics } from "web-haptics/react"
import { NavigationLink } from "./NavigationLink"
import { NavigationMobileItem } from "./NavigationMobileItem"

type NavigationMobileProps = {
    homeHref: string
    items: NavItem[]
    buttons: NavButton[]
    logo?: NavigationLogoData
}

const MENU_TRANSITION = {
    duration: 0.34,
    ease: [0.16, 1, 0.3, 1] as const,
}
const SHELL_TRANSITION = {
    duration: 0.46,
    ease: [0.16, 1, 0.3, 1] as const,
}

interface NavigationMobileState {
    isOpen: boolean
    mobileOpenKey: string | null
    isMenuClosing: boolean
    shellInsetWidth: number
    menuHeight: number
}

type NavigationMobileAction =
    | { type: "setOpen"; isOpen: boolean }
    | { type: "toggleOpen" }
    | { type: "close" }
    | { type: "toggleSubmenu"; key: string }
    | { type: "finishClosing" }
    | { type: "setShellInsetWidth"; width: number }
    | { type: "setMenuHeight"; height: number }

const initialNavigationMobileState: NavigationMobileState = {
    isOpen: false,
    mobileOpenKey: null,
    isMenuClosing: false,
    shellInsetWidth: 0,
    menuHeight: 0,
}

function navigationMobileReducer(state: NavigationMobileState, action: NavigationMobileAction): NavigationMobileState {
    switch (action.type) {
        case "setOpen":
            if (state.isOpen === action.isOpen) return state
            return {
                ...state,
                isOpen: action.isOpen,
                isMenuClosing: action.isOpen ? false : state.isOpen,
            }
        case "toggleOpen":
            return {
                ...state,
                isOpen: !state.isOpen,
                isMenuClosing: state.isOpen,
            }
        case "close":
            return {
                ...state,
                isOpen: false,
                mobileOpenKey: null,
                isMenuClosing: state.isOpen || state.isMenuClosing,
            }
        case "toggleSubmenu":
            return {
                ...state,
                mobileOpenKey: state.mobileOpenKey === action.key ? null : action.key,
            }
        case "finishClosing":
            return state.isMenuClosing ? { ...state, isMenuClosing: false } : state
        case "setShellInsetWidth":
            return state.shellInsetWidth === action.width ? state : { ...state, shellInsetWidth: action.width }
        case "setMenuHeight":
            return state.menuHeight === action.height ? state : { ...state, menuHeight: action.height }
    }
}

const NavigationMobile: React.FC<NavigationMobileProps> = ({ homeHref, items: navbarItems, buttons: navbarButtons, logo: navigationLogo }) => {
    const { trigger } = useWebHaptics()
    const [state, dispatch] = useReducer(navigationMobileReducer, initialNavigationMobileState)
    const { isOpen, mobileOpenKey, isMenuClosing, shellInsetWidth, menuHeight } = state
    const menuRef = useOutsideClick<HTMLElement>(() => dispatch({ type: "setOpen", isOpen: false }))
    const rootRef = useRef<HTMLDivElement>(null)
    const menuContentRef = useRef<HTMLDivElement>(null)
    const isShellExpanded = isOpen || isMenuClosing
    const isScrolled = useNavigationScrollState({
        onScroll: isOpen ? () => dispatch({ type: "setOpen", isOpen: false }) : undefined,
    })
    const shellScale = isScrolled && !isShellExpanded ? 0.8 : 1
    const scrolledHeaderInset = shellInsetWidth + 6
    const menuInlinePadding = isShellExpanded ? 6 : 0
    const headerInlinePadding = isShellExpanded ? 6 : isScrolled ? scrolledHeaderInset : 0
    const headerRightPadding = isShellExpanded ? 6 : isScrolled ? scrolledHeaderInset : 0

    useEffect(() => {
        if (!isMenuClosing) return

        const timeoutId = setTimeout(() => dispatch({ type: "finishClosing" }), 460)
        return () => clearTimeout(timeoutId)
    }, [isMenuClosing])

    useLayoutEffect(() => {
        const element = rootRef.current

        if (!element) {
            dispatch({ type: "setShellInsetWidth", width: 0 })
            return
        }

        const measure = () => {
            dispatch({ type: "setShellInsetWidth", width: element.clientWidth * 0.1 })
        }

        measure()

        const resizeObserver = new ResizeObserver(measure)
        resizeObserver.observe(element)

        return () => resizeObserver.disconnect()
    }, [])

    useLayoutEffect(() => {
        const element = menuContentRef.current

        if (!element || !isOpen) {
            dispatch({ type: "setMenuHeight", height: 0 })
            return
        }

        const measure = () => {
            dispatch({ type: "setMenuHeight", height: element.scrollHeight })
        }

        measure()

        const resizeObserver = new ResizeObserver(measure)
        resizeObserver.observe(element)

        return () => resizeObserver.disconnect()
    }, [isOpen, navbarItems, navbarButtons])

    const closeMenu = () => {
        trigger("medium")
        dispatch({ type: "close" })
    }

    return (
        <header className="fixed z-50 w-full overflow-hidden pt-3" ref={menuRef}>
            <Container>
                <div ref={rootRef} className="relative my-6">
                    <motion.div
                        className={cn("pointer-events-none absolute inset-0 rounded-2xl will-change-transform", isScrolled || isShellExpanded ? "bg-primary/70 backdrop-blur-md" : "bg-transparent")}
                        initial={false}
                        animate={{
                            scaleX: shellScale,
                        }}
                        style={{ transformOrigin: "center" }}
                        transition={SHELL_TRANSITION}
                    />
                    <motion.div
                        className="pointer-events-none absolute inset-0 z-10 rounded-2xl border border-white/5 will-change-transform"
                        initial={false}
                        animate={{
                            scaleX: shellScale,
                            opacity: isScrolled || isShellExpanded ? 1 : 0,
                        }}
                        style={{ transformOrigin: "center" }}
                        transition={SHELL_TRANSITION}
                    />
                    <motion.div className="relative z-10 flex flex-col overflow-hidden rounded-2xl py-1.5" initial={false}>
                        <motion.div
                            className={"w-full flex items-center justify-between gap-2"}
                            initial={false}
                            animate={{
                                paddingLeft: headerInlinePadding,
                                paddingRight: headerRightPadding,
                            }}
                            transition={SHELL_TRANSITION}
                        >
                            <Link
                                href={homeHref}
                                onClick={() => {
                                    trigger("medium")
                                    dispatch({ type: "setOpen", isOpen: false })
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
                                    dispatch({ type: "toggleOpen" })
                                }}
                            >
                                {isOpen ? <IconX className="text-secondary" /> : <IconMenu2 className="text-secondary" />}
                            </button>
                        </motion.div>
                        <AnimatePresence initial={false}>
                            {isOpen && (
                                <motion.div
                                    id="mobile-navigation-menu"
                                    key="mobile-menu"
                                    initial={{ opacity: 0, y: -4, height: 0 }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        height: menuHeight,
                                        paddingLeft: menuInlinePadding,
                                        paddingRight: menuInlinePadding,
                                    }}
                                    exit={{ opacity: 0, y: -4, height: 0 }}
                                    transition={{
                                        height: MENU_TRANSITION,
                                        opacity: { duration: 0.18, ease: "easeOut" },
                                        y: MENU_TRANSITION,
                                        paddingLeft: SHELL_TRANSITION,
                                        paddingRight: SHELL_TRANSITION,
                                    }}
                                    style={{ overflow: "hidden" }}
                                    className="flex flex-col gap-2 mt-2"
                                >
                                    <div ref={menuContentRef} className="flex flex-col gap-1">
                                        {navbarItems.map((item) => {
                                            const isOpenAcc = mobileOpenKey === item.title

                                            return (
                                                <NavigationMobileItem
                                                    key={item.title}
                                                    item={item}
                                                    isOpen={isOpenAcc}
                                                    onToggle={() => {
                                                        trigger("soft")
                                                        dispatch({ type: "toggleSubmenu", key: item.title })
                                                    }}
                                                    onNavigate={closeMenu}
                                                />
                                            )
                                        })}
                                        <div className="mt-4 w-full flex flex-col items-center gap-2 pb-2">
                                            {navbarButtons.map((button) => (
                                                <NavigationLink key={`${button.title}-${button.href}`} button={button} className="text-base!" onClick={closeMenu} />
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
        return <Image src={logo.url} width={32} height={32} alt={logo.alt ?? "Code0 Logo"} loading="eager" className="size-8 object-contain" />
    }

    return <Image src="/code0_logo_white.png" width={32} height={32} alt="Code0 Logo" loading="eager" />
}
