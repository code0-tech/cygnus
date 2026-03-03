"use client"

import { cn } from "@/lib/utils"
import { Button, Container } from "@code0-tech/pictor"
import { IconBrandGithub } from "@tabler/icons-react"
import { AnimatePresence, motion } from "motion/react"
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
    subMenuRef: React.RefObject<HTMLDivElement | null>
    handleRoute: (item: NavItem) => void
    onNavigate: (href: string) => void
    homeHref: string
}

const NavigationDesktop: React.FC<NavigationDesktopProps> = ({
    isScrolled,
    navbarItems,
    position,
    setPosition,
    activeSubMenu,
    setActiveSubMenu,
    subMenuRef,
    handleRoute,
    onNavigate,
    homeHref
}) => {
    return (
        <div className={"fixed z-100 h-max w-full pt-4"}>
            <Container>
                <motion.div
                    className={cn(
                        "my-4 p-1.5 flex flex-col justify-center gap-2 lg:gap-4 top-0 left-0 border rounded-2xl overflow-visible",
                        isScrolled ? "border border-white/5 shadow-sm bg-primary/20 backdrop-blur-xl" : "border-transparent",
                    )}
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
                                initial={fadeInUp.initial}
                                animate={fadeInUp.animate}
                                transition={fadeInUp.transition}
                            >
                                <Image src={"/code0_logo_white.png"} width={"32"} height={"32"} alt={"Code0 Logo"}/>
                            </motion.div>
                        </Link>

                        <div className={"relative h-full flex items-center"}
                            onMouseLeave={() => setPosition({ left: position.left, width: position.width, opacity: 0 })}
                        >
                            <div className={"hidden md:flex gap-2"}>
                                {navbarItems.map((item) => (
                                    <NavTab key={item.title}
                                        title={item.title}
                                        setPosition={setPosition}
                                        subMenu={item.subMenu}
                                        activeSubMenu={activeSubMenu}
                                        onClick={() => item.href && handleRoute(item)}
                                        onMouseEnter={() => setActiveSubMenu(item.subMenu || null)}
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
                                            onSelect={(subItem) => {
                                                onNavigate(subItem.href)
                                                setActiveSubMenu(null)
                                            }}
                                            variant="overlay"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className={"flex items-center gap-2"}>
                            <Button variant="normal" className="h-9!">
                                <IconBrandGithub/>
                            </Button>
                            <Button variant="filled" className="h-9! bg-white/80! hover:bg-white! text-primary!">
                                Discord
                            </Button>
                        </div>

                    </div>
                    <AnimatePresence mode="wait">
                        {activeSubMenu && isScrolled && (
                            <motion.div
                                key="submenu"
                                ref={subMenuRef}
                                initial={{ opacity: 0, height: 0, y: -10 }}
                                animate={{ opacity: 1, height: "auto", y: 0 }}
                                exit={{ opacity: 0, height: 0, y: -10 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="flex flex-col gap-2 overflow-hidden"
                            >
                                <NavSubMenu
                                    items={activeSubMenu}
                                    onSelect={(subItem) => {
                                        onNavigate(subItem.href)
                                        setActiveSubMenu(null)
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
            animate={{...position}}
            className={cn("absolute z-40 h-8 rounded-xl bg-white/10")}
        />
    )
}

export { NavigationDesktop }
