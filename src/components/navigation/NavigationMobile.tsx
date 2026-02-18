"use client"

import Link from "next/link"
import { cn } from "@/utils/cn"
import { IconBrandGithub, IconChevronUp, IconMenu2, IconX } from "@tabler/icons-react"
import { AnimatePresence, motion } from "motion/react"
import Image from "next/image"
import React from "react"
import { fadeInUp, NavItem } from "./types"
import { Button, Container } from "@code0-tech/pictor"

type NavigationMobileProps = {
    menuRef: React.RefObject<HTMLElement | null>
    isScrolled: boolean
    isOpen: boolean
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
    navbarItems: NavItem[]
    mobileOpenKey: string | null
    setMobileOpenKey: React.Dispatch<React.SetStateAction<string | null>>
    handleRoute: (item: NavItem) => void
    onNavigate: (href: string) => void
    homeHref: string
}

const NavigationMobile: React.FC<NavigationMobileProps> = ({
    menuRef,
    isScrolled,
    isOpen,
    setIsOpen,
    navbarItems,
    mobileOpenKey,
    setMobileOpenKey,
    handleRoute,
    onNavigate,
    homeHref
}) => {
    const colorClassMap: Record<string, string> = {
        brand: "group-hover:bg-brand/10 group-hover:border-brand/50 group-hover:text-brand",
        yellow: "group-hover:bg-yellow/10 group-hover:border-yellow/50 group-hover:text-yellow",
        aqua: "group-hover:bg-aqua/10 group-hover:border-aqua/50 group-hover:text-aqua",
        blue: "group-hover:bg-blue/10 group-hover:border-blue/50 group-hover:text-blue",
        pink: "group-hover:bg-pink/10 group-hover:border-pink/50 group-hover:text-pink"
    }

    return (
        <header
            className="fixed z-50 w-full overflow-hidden pt-4"
            ref={menuRef}
        >
            <Container>
            <motion.div
                className={cn(
                    "my-6 p-1.5 flex flex-col gap-2 top-0 left-0 border rounded-2xl overflow-hidden transition-colors",
                    (isScrolled || isOpen) ? "border border-white/5 shadow-sm bg-primary/20 backdrop-blur-xl" : "border-transparent",
                )}
                initial={{
                    marginLeft: "0%",
                    marginRight: "0%",
                }}
                animate={{
                    marginLeft: isScrolled && !isOpen ? "10%" : "0%",
                    marginRight: isScrolled && !isOpen ? "10%" : "0%",
                }}
                transition={{
                    type: "spring",
                    stiffness: 40,
                    damping: 10,
                }}
            >
                <div className={"w-full flex items-center justify-between gap-2"}>
                    <Link href={homeHref}>
                        <motion.div className={cn("flex transition-all", (!isScrolled && !isOpen) && "-ml-4")}
                            initial={fadeInUp.initial}
                            animate={fadeInUp.animate}
                            transition={fadeInUp.transition}
                        >
                            <Image src={"/code0_logo_white.png"} width={"32"} height={"32"} alt={"Code0 Logo"}/>
                        </motion.div>
                    </Link>
                    <motion.button
                        className={cn("bg-transparent border-0 transition-all mr-1.5", (!isScrolled && !isOpen) && "-mr-2")}
                        initial={fadeInUp.initial}
                        animate={fadeInUp.animate}
                        transition={fadeInUp.transition}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <IconX className={cn("text-white/75")}/> : <IconMenu2 className={cn("text-white/75")}/>}
                    </motion.button>
                </div>
                <AnimatePresence initial={false}>
                    {isOpen && (
                        <motion.div
                            key="mobile-menu"
                            initial={{ height: 0, opacity: isScrolled ? 1 : 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: isScrolled ? 1 : 0 }}
                            transition={{ type: "spring", bounce: 0, duration: 0.45 }}
                            style={{ overflow: "hidden" }}
                            className="flex flex-col gap-2"
                        >
                            {navbarItems.map((item, i) => {
                                const isAccordion = !!item.subMenu?.length
                                const isOpenAcc = mobileOpenKey === item.title

                                return (
                                    <div key={item.title} className="flex flex-col">
                                        <motion.button
                                            type="button"
                                            initial={{ y: -8, opacity: isScrolled ? 1 : 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: -8, opacity: isScrolled ? 1 : 0 }}
                                            transition={{ duration: 0.25, delay: 0.06 * i }}
                                            className={cn(
                                                "w-full text-left text-white/75 px-2 py-2 font-medium text-md rounded-xl transition-colors flex items-center justify-between",
                                                "hover:text-white hover:bg-white/10",
                                                isOpenAcc && "bg-white/10 text-white",
                                            )}
                                            onClick={() => {
                                                if (isAccordion) {
                                                    setMobileOpenKey(isOpenAcc ? null : item.title)
                                                } else {
                                                    handleRoute(item)
                                                    setIsOpen(false)
                                                }
                                            }}
                                        >
                                            <span>{item.title}</span>
                                            {isAccordion && (
                                                <IconChevronUp
                                                    size={20}
                                                    className={cn("transition-transform text-white/75", !isOpenAcc && "rotate-180")}
                                                />
                                            )}
                                        </motion.button>

                                        {isAccordion && (
                                            <AnimatePresence initial={false}>
                                                {isOpenAcc && (
                                                    <motion.div
                                                        key={`${item.title}-submenu`}
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.25, ease: "easeOut" }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="mt-1 flex flex-col gap-1 rounded-lg">
                                                            {item.subMenu!.map((sub) => (
                                                                <button
                                                                    key={sub.title}
                                                                    className="group flex items-center gap-2 p-2 rounded-xl text-left hover:bg-white/10"
                                                                    onClick={() => {
                                                                        onNavigate(sub.href)
                                                                        setIsOpen(false)
                                                                        setMobileOpenKey(null)
                                                                    }}
                                                                >
                                                                    <div
                                                                        className={cn(
                                                                            "p-1 rounded-lg border border-dashed border-white/20 text-gray-400",
                                                                            colorClassMap[sub.color ?? "brand"] ?? colorClassMap.brand
                                                                        )}
                                                                    >
                                                                        {sub.icon}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-white font-medium">{sub.title}</span>
                                                                        <span className="text-white/75 text-sm">{sub.description}</span>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        )}
                                    </div>
                                )
                            })}
                            <div className="mt-4 w-full flex flex-col items-center gap-2">
                                <motion.div
                                    key={"Github"}
                                    initial={{ y: -8, opacity: isScrolled ? 1 : 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -8, opacity: isScrolled ? 1 : 0 }}
                                    transition={{ duration: 0.25, delay: 0.06 * navbarItems.length }}
                                    className="flex-1 w-full"
                                >
                                    <Button
                                        variant="outlined"
                                        className="h-9! w-full! text-base! justify-center"
                                        onClick={() => {
                                            onNavigate("github")
                                            setIsOpen(false)
                                        }}
                                    >
                                        <IconBrandGithub size={20}/>
                                        Github
                                    </Button>
                                </motion.div>
                                <motion.div
                                    key={"Discord"}
                                    initial={{ y: -8, opacity: isScrolled ? 1 : 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -8, opacity: isScrolled ? 1 : 0 }}
                                    transition={{ duration: 0.25, delay: 0.06 * (navbarItems.length + 1) }}
                                    className="flex-1 w-full"
                                >
                                    <Button
                                        variant="outlined"
                                        className="h-9! w-full! text-base! justify-center bg-white/80! hover:bg-white! text-primary!"
                                        onClick={() => {
                                            onNavigate("discord")
                                            setIsOpen(false)
                                        }}
                                    >
                                        Discord
                                    </Button>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                </motion.div>
                </Container>
        </header>
    )
}

export { NavigationMobile }
