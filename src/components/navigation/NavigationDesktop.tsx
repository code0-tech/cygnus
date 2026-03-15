"use client"

import { cn } from "@/lib/utils"
import { DEFAULT_DISCORD_URL, DEFAULT_GITHUB_URL } from "@/lib/siteConfig"
import { Button, Container } from "@code0-tech/pictor"
import { SiDiscord, SiGithub } from "@icons-pack/react-simple-icons"
import { AnimatePresence, m as motion } from "motion/react"
import Image from "next/image"
import Link from "next/link"
import React from "react"
import { NavSubMenu } from "./NavSubMenu"
import { NavTab } from "./NavTab"
import { fadeInUp, NavItem, SubNavItem } from "./types"

type NavigationDesktopProps = {
    isScrolled: boolean
    navbarItems: NavItem[]
    position: { left: number; width: number; opacity: number }
    setPosition: React.Dispatch<React.SetStateAction<{ left: number; width: number; opacity: number }>>
    activeSubMenu: SubNavItem[] | null
    setActiveSubMenu: React.Dispatch<React.SetStateAction<SubNavItem[] | null>>
    setHoveredSubMenu: React.Dispatch<React.SetStateAction<SubNavItem[] | null>>
    subMenuRef: React.RefObject<HTMLDivElement | null>
    homeHref: string
}

const NavigationDesktop: React.FC<NavigationDesktopProps> = ({
    isScrolled,
    navbarItems,
    position,
    setPosition,
    activeSubMenu,
    setActiveSubMenu,
    setHoveredSubMenu,
    subMenuRef,
    homeHref,
}) => {
    return (
        <div className={"fixed z-100 h-max w-full pt-4"}>
            <Container>
                <motion.div
                    layout
                    className={cn(
                        "my-4 flex flex-col justify-center gap-2 overflow-visible rounded-2xl border p-1.5 top-0 left-0 lg:gap-4",
                        isScrolled && "lg:mx-[10%]",
                        isScrolled ? "border border-white/5 shadow-sm bg-primary/20 backdrop-blur-xl" : "border-transparent",
                    )}
                    onMouseLeave={() => {
                        setPosition({ left: position.left, width: position.width, opacity: 0 })
                        setActiveSubMenu(null)
                        setHoveredSubMenu(null)
                    }}
                    initial={{
                        marginLeft: "0%",
                        marginRight: "0%",
                    }}
                    animate={{
                        marginLeft: isScrolled ? "10%" : "0%",
                        marginRight: isScrolled ? "10%" : "0%"
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 40,
                        damping: 10,
                    }}
                >
                    <div className={"w-full h-full flex items-center justify-between gap-2"}>

                        <Link href={homeHref}>
                            <motion.div className={cn("flex transition-all", !isScrolled && "-ml-4")}
                                initial={false}
                                animate={fadeInUp.animate}
                                transition={fadeInUp.transition}
                            >
                                <Image src={"/code0_logo_white.png"} width={"32"} height={"32"} alt={"Code0 Logo"} loading="eager"/>
                            </motion.div>
                        </Link>

                        <div className={"relative h-full flex items-center"}>
                            <div className={"hidden md:flex gap-2"}>
                                {navbarItems.map((item) => (
                                    <NavTab key={item.title}
                                        title={item.title}
                                        href={item.href}
                                        setPosition={setPosition}
                                        subMenu={item.subMenu}
                                        activeSubMenu={activeSubMenu}
                                        onMouseEnter={() => {
                                            setActiveSubMenu(item.subMenu || null)
                                            setHoveredSubMenu(item.subMenu || null)
                                        }}
                                    />
                                ))}
                            </div>
                            <Cursor position={position} />
                            {activeSubMenu && !isScrolled && (
                                <div
                                    ref={subMenuRef}
                                    className="absolute z-50 shadow-lg"
                                    style={{ left: position.left, top: "100%" }}
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
                    <AnimatePresence mode="wait">
                        {activeSubMenu && isScrolled && (
                            <motion.div
                                key="submenu"
                                ref={subMenuRef}
                                layout
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="flex flex-col gap-2 overflow-hidden"
                            >
                                <NavSubMenu
                                    items={activeSubMenu}
                                    onSelect={() => {
                                        setActiveSubMenu(null)
                                        setHoveredSubMenu(null)
                                    }}
                                    variant="inline"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </Container>
        </div>
    )
}

const Cursor: React.FC<{ position: {left: number, width: number, opacity: number} }> = ({ position }) => {
    return (
        <motion.div
            animate={{ x: position.left, opacity: position.opacity }}
            transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.9 }}
            className={cn("absolute z-40 h-8 rounded-xl bg-white/10 will-change-transform")}
            style={{ width: position.width }}
        />
    )
}

export { NavigationDesktop }
