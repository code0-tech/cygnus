"use client"

import { cn } from "@/lib/utils"
import { useNavigationScrollState } from "@/hooks/useNavigationScrollState"
import { useNavigationViewModel } from "@/hooks/useNavigationViewModel"
import { type AppLocale } from "@/lib/i18n"
import type { NavbarButtonData } from "@/lib/navigation"
import type { NavbarItem } from "@/payload-types"
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/NavigationMenu"
import { Container } from "@code0-tech/pictor"
import Image from "next/image"
import Link from "next/link"
import React, { useEffect, useRef, useState } from "react"
import { NavigationCursor, type NavigationCursorHandle } from "./NavigationCursor"
import { NavigationLink } from "./NavigationLink"
import { NavigationSubMenu } from "./NavigationSubMenu"

type NavigationDesktopProps = {
    locale: AppLocale
    items: NavbarItem[]
    buttons: NavbarButtonData[]
}

const NavigationDesktop: React.FC<NavigationDesktopProps> = ({ locale, items, buttons }) => {
    const navTabsRef = useRef<HTMLDivElement>(null)
    const cursorRef = useRef<NavigationCursorHandle>(null)
    const suppressMenuOpenRef = useRef(false)
    const [activeMenuValue, setActiveMenuValue] = useState<string | null>(null)
    const { homeHref, navbarItems, navbarButtons } = useNavigationViewModel(locale, items, buttons)
    const isScrolled = useNavigationScrollState({
        onScroll: () => {
            suppressMenuOpenRef.current = true
            setActiveMenuValue(null)
            cursorRef.current?.hide()
        },
    })

    const navItemClassName = "relative z-50 flex cursor-pointer items-center gap-2 rounded-xl px-4 py-1 font-medium"
    const navTriggerClassName = cn(navItemClassName, "h-auto pr-1 bg-transparent text-base text-white hover:bg-transparent focus:bg-transparent data-popup-open:bg-transparent data-open:bg-transparent")

    useEffect(() => {
        if (!isScrolled) return

        setActiveMenuValue(null)
        cursorRef.current?.hide()
    }, [isScrolled])

    const updateIndicatorFromElement = (element: HTMLElement) => {
        if (!navTabsRef.current) return
        cursorRef.current?.moveTo(element, navTabsRef.current)
    }

    return (
        <div
            className={cn(
                "fixed z-50 h-max w-full border-b transition-[padding,background-color,border-color,backdrop-filter] duration-200 ease-out",
                isScrolled
                    ? "border-white/10 bg-primary/50 pt-1 backdrop-blur-lg"
                    : "border-transparent bg-transparent pt-3"
            )}
        >
            <Container>
                <div
                    className={cn("relative transition-[padding] duration-200 ease-out", isScrolled ? "py-2" : "py-4")}
                    onPointerMove={() => {
                        suppressMenuOpenRef.current = false
                    }}
                    onMouseLeave={() => {
                        cursorRef.current?.hide()
                        setActiveMenuValue(null)
                    }}
                >
                    <div className={"w-full h-full flex items-center justify-between gap-2"}>

                        <Link href={homeHref}>
                            <div className="flex">
                                <Image src={"/code0_logo_white.png"} width={"32"} height={"32"} alt={"Code0 Logo"} loading="eager"/>
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
                                                            onMouseEnter={(event) => updateIndicatorFromElement(event.currentTarget)}
                                                            onFocusCapture={(event) => updateIndicatorFromElement(event.currentTarget)}
                                                        >
                                                            <NavigationMenuTrigger className={navTriggerClassName}>
                                                                {item.title}
                                                            </NavigationMenuTrigger>
                                                        </div>
                                                        <NavigationMenuContent className="p-2">
                                                            <NavigationSubMenu
                                                                items={item.subMenu!}
                                                                onSelect={() => setActiveMenuValue(null)}
                                                            />
                                                        </NavigationMenuContent>
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
                                <NavigationLink
                                    key={`${button.title}-${button.href}`}
                                    button={button}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    )
}

export { NavigationDesktop }
