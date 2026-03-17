"use client"

import { cn } from "@/lib/utils"
import { DEFAULT_DISCORD_URL, DEFAULT_GITHUB_URL } from "@/lib/siteConfig"
import { Button, Container } from "@code0-tech/pictor"
import { SiGithub } from '@icons-pack/react-simple-icons'
import { IconChevronUp, IconMenu2, IconX } from "@tabler/icons-react"
import { AnimatePresence, m as motion } from "motion/react"
import Image from "next/image"
import Link from "next/link"
import React from "react"
import { useWebHaptics } from "web-haptics/react"
import { fadeInUp, NavItem } from "./types"

type NavigationMobileProps = {
    menuRef: React.RefObject<HTMLElement | null>
    isScrolled: boolean
    isOpen: boolean
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
    navbarItems: NavItem[]
    mobileOpenKey: string | null
    setMobileOpenKey: React.Dispatch<React.SetStateAction<string | null>>
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
    homeHref,
}) => {
    const { trigger } = useWebHaptics()

    return (
        <header
            className="fixed z-50 w-full overflow-hidden pt-4"
            ref={menuRef}
        >
            <Container>
            <motion.div
                layout
                className={cn(
                    "my-6 flex flex-col gap-2 overflow-hidden rounded-2xl border p-1.5 top-0 left-0 transition-colors",
                    isScrolled && !isOpen && "mx-[10%]",
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
                        <Link
                            href={homeHref}
                            onClick={() => {
                                trigger("medium")
                                setIsOpen(false)
                            }}
                        >
                        <motion.div className={cn("flex transition-all", (!isScrolled && !isOpen) && "-ml-4")}
                            initial={false}
                            animate={fadeInUp.animate}
                            transition={fadeInUp.transition}
                        >
                            <Image src={"/code0_logo_white.png"} width={"32"} height={"32"} alt={"Code0 Logo"} loading="eager"/>
                        </motion.div>
                    </Link>
                    <motion.button
                            className={cn("bg-transparent border-0 transition-all mr-1.5", (!isScrolled && !isOpen) && "-mr-2")}
                            initial={false}
                            animate={fadeInUp.animate}
                            transition={fadeInUp.transition}
                            onClick={() => {
                                trigger("medium")
                                setIsOpen(!isOpen)
                            }}
                    >
                        {isOpen ? <IconX className={cn("text-white/75")}/> : <IconMenu2 className={cn("text-white/75")}/>}
                    </motion.button>
                </div>
                <AnimatePresence initial={false}>
                    {isOpen && (
                        <motion.div
                            key="mobile-menu"
                            layout
                            initial={{ opacity: isScrolled ? 1 : 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: isScrolled ? 1 : 0, y: -8 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            style={{ overflow: "hidden" }}
                            className="flex flex-col gap-2"
                        >
                            {navbarItems.map((item, i) => {
                                const isAccordion = !!item.subMenu?.length
                                const isOpenAcc = mobileOpenKey === item.title

                                const hasRoute = Boolean(item.href)
                                return (
                                    <div key={item.title} className="flex flex-col">
                                        <motion.div
                                            initial={{ y: -8, opacity: isScrolled ? 1 : 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: -8, opacity: isScrolled ? 1 : 0 }}
                                            transition={{ duration: 0.25, delay: 0.06 * i }}
                                        >
                                            {isAccordion ? (
                                                <button
                                                    type="button"
                                                    className={cn(
                                                        "w-full text-left text-white/75 px-2 py-2 font-medium text-md rounded-xl transition-colors flex items-center justify-between",
                                                        "hover:text-white hover:bg-white/10",
                                                        isOpenAcc && "bg-white/10 text-white",
                                                    )}
                                                    onClick={() => {
                                                        trigger("soft")
                                                        setMobileOpenKey(isOpenAcc ? null : item.title)
                                                    }}
                                                >
                                                    <span>{item.title}</span>
                                                    <IconChevronUp
                                                        size={20}
                                                        className={cn("transition-transform text-white/75", !isOpenAcc && "rotate-180")}
                                                    />
                                                </button>
                                            ) : (
                                                <Link
                                                    href={item.href ?? "#"}
                                                    className={cn(
                                                        "w-full text-left text-white/75 px-2 py-2 font-medium text-md rounded-xl transition-colors flex items-center justify-between",
                                                        "hover:text-white hover:bg-white/10",
                                                        isOpenAcc && "bg-white/10 text-white",
                                                        !hasRoute && "pointer-events-none opacity-60",
                                                    )}
                                                    onClick={() => {
                                                        trigger("medium")
                                                        setIsOpen(false)
                                                    }}
                                                >
                                                    <span>{item.title}</span>
                                                </Link>
                                            )}
                                        </motion.div>

                                        {isAccordion && (
                                            <AnimatePresence initial={false}>
                                                {isOpenAcc && (
                                                    <motion.div
                                                        key={`${item.title}-submenu`}
                                                        layout
                                                        initial={{ opacity: 0, y: -6 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -6 }}
                                                        transition={{ duration: 0.18, ease: "easeOut" }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="mt-1 flex flex-col gap-1 rounded-lg">
                                                            {item.subMenu!.map((sub) => (
                                                                <Link
                                                                    key={sub.title}
                                                                    href={sub.href}
                                                                    className="group flex items-center gap-2 p-2 rounded-xl text-left hover:bg-white/10"
                                                                    onClick={() => {
                                                                        trigger("medium")
                                                                        setIsOpen(false)
                                                                        setMobileOpenKey(null)
                                                                    }}
                                                                >
                                                                    <div
                                                                        className="p-1 rounded-lg border border-dashed border-white/20 text-gray-400 group-hover:text-white group-hover:border-white/60">
                                                                        {sub.icon}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-white font-medium">{sub.title}</span>
                                                                        <span className="text-white/75 text-sm">{sub.description}</span>
                                                                    </div>
                                                                </Link>
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
                                    <Link
                                        href={DEFAULT_GITHUB_URL}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={() => {
                                            trigger("medium")
                                            setIsOpen(false)
                                        }}
                                    >
                                        <Button
                                            variant="outlined"
                                            className="h-9! w-full! text-base! justify-center"
                                        >
                                            <SiGithub size={20}/>
                                            Github
                                        </Button>
                                    </Link>
                                </motion.div>
                                <motion.div
                                    key={"Discord"}
                                    initial={{ y: -8, opacity: isScrolled ? 1 : 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -8, opacity: isScrolled ? 1 : 0 }}
                                    transition={{ duration: 0.25, delay: 0.06 * (navbarItems.length + 1) }}
                                    className="flex-1 w-full"
                                >
                                    <Link
                                        href={DEFAULT_DISCORD_URL}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={() => {
                                            trigger("medium")
                                            setIsOpen(false)
                                        }}
                                    >
                                        <Button
                                            variant="outlined"
                                            className="h-9! w-full! text-base! justify-center bg-white/80! hover:bg-white! text-primary!"
                                        >
                                            Discord
                                        </Button>
                                    </Link>
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
