"use client"

import { cn } from "@/lib/utils"
import { useNavigationScrollState } from "@/hooks/useNavigationScrollState"
import { useNavigationViewModel } from "@/hooks/useNavigationViewModel"
import { type AppLocale } from "@/lib/i18n"
import type { NavigationLogoData, NavbarButtonData, NavbarItemData } from "@/lib/navigation"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/NavigationMenu"
import { Container } from "@code0-tech/pictor"
import { AnimatePresence, m as motion } from "motion/react"
import Image from "next/image"
import Link from "next/link"
import React, { useEffect, useLayoutEffect, useRef, useState } from "react"
import { NavigationCursor, type NavigationCursorHandle } from "./NavigationCursor"
import { NavigationLink } from "./NavigationLink"
import { NavigationSubMenu } from "./NavigationSubMenu"

type NavigationDesktopProps = {
    locale: AppLocale
    items: NavbarItemData[]
    buttons: NavbarButtonData[]
    logo?: NavigationLogoData
}

const NavigationDesktop: React.FC<NavigationDesktopProps> = ({ locale, items, buttons, logo }) => {
    const rootRef = useRef<HTMLDivElement>(null)
    const navTabsRef = useRef<HTMLDivElement>(null)
    const submenuContentRef = useRef<HTMLDivElement>(null)
    const cursorRef = useRef<NavigationCursorHandle>(null)
    const suppressMenuOpenRef = useRef(false)
    const [activeMenuValue, setActiveMenuValue] = useState<string | null>(null)
    const [shellInsetWidth, setShellInsetWidth] = useState(0)
    const [submenuHeight, setSubmenuHeight] = useState(0)
    const { homeHref, navbarItems, navbarButtons, logo: navigationLogo } = useNavigationViewModel(locale, items, buttons, logo)
    const isScrolled = useNavigationScrollState({
        onScroll: () => {
            suppressMenuOpenRef.current = true
            setActiveMenuValue(null)
            cursorRef.current?.hide()
        },
    })

    const navItemClassName = "relative z-50 flex cursor-pointer items-center gap-2 rounded-xl px-4 py-1 font-medium"
    const navTriggerClassName = cn(
        navItemClassName,
        "h-auto pr-1 bg-transparent text-base text-white hover:bg-transparent focus:bg-transparent data-popup-open:bg-transparent data-open:bg-transparent"
    )
    const activeMenuItem = navbarItems.find((item) => item.title === activeMenuValue)
    const activeSubMenu = activeMenuItem?.subMenu?.length ? activeMenuItem.subMenu : null
    const shellTransition = {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
    } as const
    const shellInset = isScrolled ? shellInsetWidth + 14 : 0
    const contentInset = isScrolled ? shellInsetWidth + 20 : 12

    useEffect(() => {
        if (!isScrolled) return

        setActiveMenuValue(null)
        cursorRef.current?.hide()
    }, [isScrolled])

    useLayoutEffect(() => {
        const element = submenuContentRef.current

        if (!element || !activeSubMenu || !isScrolled) {
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
    }, [activeSubMenu, isScrolled])

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

    const updateIndicatorFromElement = (element: HTMLElement) => {
        if (!navTabsRef.current) return
        cursorRef.current?.moveTo(element, navTabsRef.current)
    }

    return (
        <div className="fixed z-50 h-max w-full pt-3">
            <Container>
                <div
                    ref={rootRef}
                    className="relative my-4"
                    onPointerMove={() => {
                        suppressMenuOpenRef.current = false
                    }}
                    onMouseLeave={() => {
                        cursorRef.current?.hide()
                        setActiveMenuValue(null)
                    }}
                >
                    <motion.div
                        className={cn("pointer-events-none absolute inset-0 rounded-2xl", isScrolled ? "bg-primary/50 backdrop-blur-lg" : "bg-transparent")}
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
                            opacity: isScrolled ? 1 : 0,
                        }}
                        transition={shellTransition}
                    />
                    <motion.div
                        className="relative z-10 flex flex-col overflow-visible rounded-2xl p-1.5"
                        initial={false}
                        animate={{
                            paddingLeft: isScrolled ? contentInset : 0,
                            paddingRight: isScrolled ? contentInset : 0,
                        }}
                        transition={shellTransition}
                    >
                        <div className={"w-full h-full flex items-center justify-between gap-2"}>
                            <Link href={homeHref}>
                                <div className="flex">
                                    <NavigationLogo logo={navigationLogo} />
                                </div>
                            </Link>

                            <div
                                ref={navTabsRef}
                                className={"relative h-full flex items-center"}
                                onBlurCapture={(event) => {
                                    const nextFocusedElement = event.relatedTarget

                                    if (!(nextFocusedElement instanceof Node) || !event.currentTarget.contains(nextFocusedElement)) {
                                        cursorRef.current?.hide()
                                    }
                                }}
                            >
                                <NavigationMenu
                                    value={activeMenuValue}
                                    onValueChange={(value) => {
                                        if (value && suppressMenuOpenRef.current) return
                                        if (isScrolled && !value) return

                                        setActiveMenuValue(value)
                                    }}
                                    delay={40}
                                    closeDelay={80}
                                    align="start"
                                    className="hidden md:flex max-w-none flex-none"
                                >
                                    <NavigationMenuList className="gap-2">
                                        {navbarItems.map((item) => {
                                            const itemValue = item.title
                                            const hasSubMenu = Boolean(item.subMenu?.length)

                                            return (
                                                <NavigationMenuItem key={item.title} value={itemValue}>
                                                    {hasSubMenu ? (
                                                        <>
                                                            <div
                                                                className="relative z-50"
                                                                onMouseEnter={(event) => {
                                                                    updateIndicatorFromElement(event.currentTarget)

                                                                    if (isScrolled && !suppressMenuOpenRef.current) {
                                                                        setActiveMenuValue(itemValue)
                                                                    }
                                                                }}
                                                                onFocusCapture={(event) => {
                                                                    updateIndicatorFromElement(event.currentTarget)

                                                                    if (isScrolled) {
                                                                        setActiveMenuValue(itemValue)
                                                                    }
                                                                }}
                                                            >
                                                                <NavigationMenuTrigger className={navTriggerClassName}>{item.title}</NavigationMenuTrigger>
                                                            </div>
                                                            {!isScrolled && (
                                                                <NavigationMenuContent className="p-2">
                                                                    <NavigationSubMenu items={item.subMenu!} onSelect={() => setActiveMenuValue(null)} />
                                                                </NavigationMenuContent>
                                                            )}
                                                        </>
                                                    ) : item.href ? (
                                                        <div
                                                            className="relative z-50"
                                                            onMouseEnter={(event) => {
                                                                updateIndicatorFromElement(event.currentTarget)
                                                                setActiveMenuValue(null)
                                                            }}
                                                            onFocusCapture={(event) => {
                                                                updateIndicatorFromElement(event.currentTarget)
                                                                setActiveMenuValue(null)
                                                            }}
                                                        >
                                                            <NavigationMenuLink
                                                                render={<Link href={item.href} />}
                                                                className={cn(navItemClassName, "text-base text-white hover:bg-transparent focus:bg-transparent")}
                                                            >
                                                                {item.title}
                                                            </NavigationMenuLink>
                                                        </div>
                                                    ) : null}
                                                </NavigationMenuItem>
                                            )
                                        })}
                                    </NavigationMenuList>
                                </NavigationMenu>
                                <NavigationCursor ref={cursorRef} />
                            </div>
                            <div className={"flex items-center gap-2"}>
                                {navbarButtons.map((button) => (
                                    <NavigationLink key={`${button.title}-${button.href}`} button={button} />
                                ))}
                            </div>
                        </div>
                        <AnimatePresence initial={false}>
                            {isScrolled && activeSubMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: submenuHeight }}
                                    exit={{ opacity: 0, y: -6, height: 0 }}
                                    transition={{
                                        height: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
                                        opacity: { duration: 0.16, ease: "easeOut" },
                                        y: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
                                    }}
                                    className="overflow-hidden px-2"
                                >
                                    <div ref={submenuContentRef} className="pt-1">
                                        <NavigationSubMenu items={activeSubMenu} onSelect={() => setActiveMenuValue(null)} />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </Container>
        </div>
    )
}

export { NavigationDesktop }

function NavigationLogo({ logo }: { logo?: NavigationLogoData }) {
    if (logo && typeof logo !== "number" && logo.url) {
        return <Image src={logo.url} width={32} height={32} alt={logo.alt ?? "Code0 Logo"} loading="eager" className="size-8 object-contain" />
    }

    return <Image src="/code0_logo_white.png" width={32} height={32} alt="Code0 Logo" loading="eager" />
}
