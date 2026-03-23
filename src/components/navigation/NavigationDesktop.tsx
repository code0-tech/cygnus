"use client"

import { cn } from "@/lib/utils"
import { DEFAULT_DISCORD_URL, DEFAULT_GITHUB_URL } from "@/lib/siteConfig"
import { Button, Container } from "@code0-tech/pictor"
import { SiDiscord, SiGithub } from "@icons-pack/react-simple-icons"
import { AnimatePresence, m as motion, useMotionValue, useSpring } from "motion/react"
import Image from "next/image"
import Link from "next/link"
import React, { useLayoutEffect, useRef, useState } from "react"
import { NavSubMenu } from "./NavSubMenu"
import { NavTab } from "./NavTab"
import { fadeInUp, NavItem, SubNavItem } from "./Navigation"

type NavigationDesktopProps = {
    isScrolled: boolean
    navbarItems: NavItem[]
    activeSubMenu: SubNavItem[] | null
    setActiveSubMenu: React.Dispatch<React.SetStateAction<SubNavItem[] | null>>
    setHoveredSubMenu: React.Dispatch<React.SetStateAction<SubNavItem[] | null>>
    subMenuRef: React.RefObject<HTMLDivElement | null>
    homeHref: string
}

const NavigationDesktop: React.FC<NavigationDesktopProps> = ({
    isScrolled,
    navbarItems,
    activeSubMenu,
    setActiveSubMenu,
    setHoveredSubMenu,
    subMenuRef,
    homeHref,
}) => {
    const rootRef = useRef<HTMLDivElement>(null)
    const submenuContentRef = useRef<HTMLDivElement>(null)
    const navTabsRef = useRef<HTMLDivElement>(null)
    const [submenuHeight, setSubmenuHeight] = useState(0)
    const [overlayOffsetLeft, setOverlayOffsetLeft] = useState(0)
    const [overlayPosition, setOverlayPosition] = useState({ left: 0, width: 0, opacity: 0 })
    const cursorX = useSpring(useMotionValue(0), { stiffness: 260, damping: 30, mass: 0.9 })
    const cursorOpacity = useSpring(useMotionValue(0), { stiffness: 260, damping: 30, mass: 0.9 })
    const cursorWidth = useSpring(useMotionValue(0), { stiffness: 260, damping: 30, mass: 0.9 })

    const updateIndicatorPosition = (nextPosition: { left: number; width: number; opacity: number }) => {
        cursorX.set(nextPosition.left)
        cursorWidth.set(nextPosition.width)
        cursorOpacity.set(nextPosition.opacity)
        setOverlayPosition(nextPosition)
    }

    useLayoutEffect(() => {
        const element = submenuContentRef.current
        if (!element) {
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
    }, [activeSubMenu])

    useLayoutEffect(() => {
        const rootElement = rootRef.current
        const navTabsElement = navTabsRef.current
        if (!rootElement || !navTabsElement) {
            setOverlayOffsetLeft(0)
            return
        }

        const measure = () => {
            const rootRect = rootElement.getBoundingClientRect()
            const navTabsRect = navTabsElement.getBoundingClientRect()
            setOverlayOffsetLeft(navTabsRect.left - rootRect.left)
        }

        measure()

        const resizeObserver = new ResizeObserver(measure)
        resizeObserver.observe(rootElement)
        resizeObserver.observe(navTabsElement)

        return () => resizeObserver.disconnect()
    }, [isScrolled])

    return (
        <div className={"fixed z-100 h-max w-full pt-3"}>
            <Container>
                <div
                    ref={rootRef}
                    className="relative"
                    onMouseLeave={() => {
                        cursorOpacity.set(0)
                        setOverlayPosition((prev) => ({ ...prev, opacity: 0 }))
                        setActiveSubMenu(null)
                        setHoveredSubMenu(null)
                    }}
                >
                    <div className="relative my-4">
                        <motion.div
                            className={cn(
                                "pointer-events-none absolute inset-0 rounded-2xl shadow-sm",
                                isScrolled ? "bg-primary/50 backdrop-blur-lg" : "bg-transparent shadow-none",
                            )}
                            initial={{
                                clipPath: "inset(0% 0% 0% 0% round 1rem)",
                            }}
                            animate={{
                                clipPath: isScrolled
                                    ? "inset(0% 10% 0% 10% round 1rem)"
                                    : "inset(0% 0% 0% 0% round 1rem)",
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 40,
                                damping: 10,
                            }}
                        />
                        <motion.div
                            className="pointer-events-none absolute inset-0 z-10 rounded-2xl border border-white/5"
                            initial={false}
                            animate={{
                                left: isScrolled ? "10%" : "0%",
                                right: isScrolled ? "10%" : "0%",
                                opacity: isScrolled ? 1 : 0,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 40,
                                damping: 10,
                            }}
                        />
                        <motion.div
                            className="relative z-10 flex flex-col gap-2 overflow-visible rounded-2xl p-1.5 lg:gap-4"
                            initial={false}
                            animate={{
                                paddingLeft: isScrolled ? "10%" : "0%",
                                paddingRight: isScrolled ? "calc(10% + 0.5rem)" : "0%",
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 40,
                                damping: 10,
                            }}
                        >
                        <div className={"w-full h-full flex items-center justify-between gap-2"}>

                        <Link href={homeHref}>
                            <motion.div className="flex transition-all"
                                initial={false}
                                animate={fadeInUp.animate}
                                transition={fadeInUp.transition}
                            >
                                <Image src={"/code0_logo_white.png"} width={"32"} height={"32"} alt={"Code0 Logo"} loading="eager"/>
                            </motion.div>
                        </Link>

                        <div ref={navTabsRef} className={"relative h-full flex items-center"}>
                            <div className={"hidden md:flex gap-2"}>
                                {navbarItems.map((item) => (
                                    <NavTab key={item.title}
                                        title={item.title}
                                        href={item.href}
                                        setPosition={updateIndicatorPosition}
                                        containerRef={navTabsRef}
                                        subMenu={item.subMenu}
                                        activeSubMenu={activeSubMenu}
                                        onMouseEnter={() => {
                                            setActiveSubMenu(item.subMenu || null)
                                            setHoveredSubMenu(item.subMenu || null)
                                        }}
                                    />
                                ))}
                            </div>
                            <Cursor x={cursorX} width={cursorWidth} opacity={cursorOpacity} />
                        </div>
                        <div className={"flex items-center gap-2"}>
                            <Link href={DEFAULT_GITHUB_URL} target="_blank" rel="noreferrer">
                                <Button variant="normal" className="h-9! px-2!">
                                    <SiGithub size={18} />
                                    <span className="hidden xl:inline">Github</span>
                                </Button>
                            </Link>
                            <Link href={DEFAULT_DISCORD_URL} target="_blank" rel="noreferrer">
                                <Button variant="filled" className="h-9! px-2! bg-white/80! hover:bg-white! text-primary!">
                                    <span className="hidden xl:inline">Discord</span>
                                    <SiDiscord size={18} className="xl:hidden"/>
                                </Button>
                            </Link>
                        </div>
                    </div>
                    <AnimatePresence initial={false} mode="wait">
                        {activeSubMenu && isScrolled && (
                            <motion.div
                                key="submenu"
                                ref={subMenuRef}
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: submenuHeight + 4 }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="flex flex-col overflow-hidden pl-2"
                            >
                                <div ref={submenuContentRef}>
                                    <NavSubMenu
                                        items={activeSubMenu}
                                        onSelect={() => {
                                            setActiveSubMenu(null)
                                            setHoveredSubMenu(null)
                                        }}
                                        variant="inline"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                        </motion.div>
                    </div>
                    {activeSubMenu && !isScrolled && (
                        <div
                            ref={subMenuRef}
                            className="absolute z-50 shadow-lg"
                            style={{ left: overlayOffsetLeft + overlayPosition.left, top: "100%" }}
                        >
                            <div className="mt-2 rounded-xl border border-white/5 bg-primary/90 backdrop-blur-xl shadow-xl p-2 w-max">
                                <NavSubMenu
                                    items={activeSubMenu}
                                    onSelect={() => {
                                        setActiveSubMenu(null)
                                        setHoveredSubMenu(null)
                                    }}
                                    variant="overlay"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </Container>
        </div>
    )
}

const Cursor: React.FC<{
    x: ReturnType<typeof useSpring>
    width: ReturnType<typeof useSpring>
    opacity: ReturnType<typeof useSpring>
}> = ({ x, width, opacity }) => {
    return (
        <motion.div
            className="absolute z-40 h-8 rounded-xl bg-white/10 will-change-transform"
            style={{ x, width, opacity }}
        />
    )
}

export { NavigationDesktop }
