"use client"

import { cn } from "@/lib/utils"
import { DEFAULT_DISCORD_URL, DEFAULT_GITHUB_URL } from "@/lib/siteConfig"
import { Button, Container } from "@code0-tech/pictor"
import { SiGithub } from '@icons-pack/react-simple-icons'
import { IconChevronUp, IconMenu2, IconX } from "@tabler/icons-react"
import { AnimatePresence, m as motion } from "motion/react"
import Image from "next/image"
import Link from "next/link"
import React, { useEffect, useRef, useState } from "react"
import { useWebHaptics } from "web-haptics/react"
import { fadeInUp, NavItem } from "./Navigation"

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
    const wasOpenRef = useRef(false)
    const [isMenuClosing, setIsMenuClosing] = useState(false)
    const shellTransition = {
        duration: 0.34,
        ease: [0.22, 1, 0.36, 1] as const,
    }
    const menuTransition = {
        duration: 0.24,
        ease: [0.22, 1, 0.36, 1] as const,
    }
    const isShellExpanded = isOpen || isMenuClosing

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

    return (
        <header
            className="fixed z-50 w-full overflow-hidden pt-3"
            ref={menuRef}
        >
            <Container>
                <div className="relative my-6">
                    <motion.div
                        className={cn(
                            "pointer-events-none absolute inset-0 rounded-2xl shadow-sm",
                            (isScrolled || isShellExpanded) ? "bg-primary/50 backdrop-blur-lg" : "bg-transparent shadow-none",
                        )}
                        initial={false}
                        animate={{
                            clipPath: isScrolled && !isShellExpanded
                                ? "inset(0% 10% 0% 10% round 1rem)"
                                : "inset(0% 0% 0% 0% round 1rem)",
                        }}
                        transition={shellTransition}
                    />
                    <motion.div
                        className="pointer-events-none absolute inset-0 z-10 rounded-2xl border border-white/5"
                        initial={false}
                        animate={{
                            left: isScrolled && !isShellExpanded ? "10%" : "0%",
                            right: isScrolled && !isShellExpanded ? "10%" : "0%",
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
                            paddingLeft: isOpen
                                ? "calc(0% + 0.5rem)"
                                : isScrolled
                                  ? "calc(10% + 0rem)"
                                  : "calc(0% + 0rem)",
                            paddingRight: isOpen
                                ? "calc(0% + 0.5rem)"
                                : isScrolled
                                  ? "calc(10% + 0.5rem)"
                                  : "calc(0% + 0rem)",
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
                            <motion.div className="flex transition-all"
                                initial={false}
                                animate={fadeInUp.animate}
                                transition={fadeInUp.transition}
                            >
                                <Image src={"/code0_logo_white.png"} width={"32"} height={"32"} alt={"Code0 Logo"} loading="eager"/>
                            </motion.div>
                        </Link>
                        <motion.button
                                className="mr-1.5 border-0 bg-transparent transition-all"
                                initial={false}
                                animate={fadeInUp.animate}
                                transition={fadeInUp.transition}
                                onClick={() => {
                                    trigger("medium")
                                    setIsOpen(!isOpen)
                                }}
                        >
                            {isOpen ? <IconX className="text-white/75"/> : <IconMenu2 className="text-white/75"/>}
                        </motion.button>
                    </motion.div>
                    <AnimatePresence initial={false}>
                        {isOpen && (
                            <motion.div
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
                                className="flex flex-col gap-2 px-2"
                            >
                                <div>
                                    {navbarItems.map((item, i) => {
                                        const isAccordion = !!item.subMenu?.length
                                        const isOpenAcc = mobileOpenKey === item.title

                                        const hasRoute = Boolean(item.href)
                                        return (
                                            <div key={item.title} className="flex flex-col">
                                                <motion.div
                                                    initial={{ y: -6, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    exit={{ y: -6, opacity: 0 }}
                                                    transition={{ duration: 0.22, delay: 0.05 * i }}
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
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{
                                                                    height: {
                                                                        duration: 0.24,
                                                                        ease: [0.22, 1, 0.36, 1],
                                                                    },
                                                                    opacity: {
                                                                        duration: 0.16,
                                                                        ease: "easeOut",
                                                                    },
                                                                }}
                                                                className="overflow-hidden"
                                                            >
                                                                <motion.div
                                                                    className="mt-1 flex flex-col gap-1 rounded-lg"
                                                                    initial="closed"
                                                                    animate="open"
                                                                    exit="closed"
                                                                    variants={{
                                                                        open: {
                                                                            transition: {
                                                                                staggerChildren: 0.035,
                                                                                delayChildren: 0.03,
                                                                            },
                                                                        },
                                                                        closed: {
                                                                            transition: {
                                                                                staggerChildren: 0.025,
                                                                                staggerDirection: -1,
                                                                            },
                                                                        },
                                                                    }}
                                                                >
                                                                    {item.subMenu!.map((sub) => (
                                                                        <motion.div
                                                                            key={sub.title}
                                                                            variants={{
                                                                                open: { opacity: 1, y: 0 },
                                                                                closed: { opacity: 0, y: -4 },
                                                                            }}
                                                                            transition={{
                                                                                duration: 0.18,
                                                                                ease: [0.22, 1, 0.36, 1],
                                                                            }}
                                                                        >
                                                                            <Link
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
                                                                        </motion.div>
                                                                    ))}
                                                                </motion.div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                )}
                                            </div>
                                        )
                                    })}
                                    <div className="mt-4 w-full flex flex-col items-center gap-2 pb-2">
                                        <motion.div
                                            key={"Github"}
                                            initial={{ y: -6, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: -6, opacity: 0 }}
                                            transition={{ duration: 0.22, delay: 0.05 * navbarItems.length }}
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
                                            initial={{ y: -6, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: -6, opacity: 0 }}
                                            transition={{ duration: 0.22, delay: 0.05 * (navbarItems.length + 1) }}
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
