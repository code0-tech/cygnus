"use client"

import { motion, AnimatePresence } from "motion/react"
import { useRouter } from "next/navigation"
import type React from "react"
import {useEffect, useRef, useState} from "react"
import {cn} from "@/utils/cn"
import Image from "next/image"
import {useMediaQuery} from "@/hooks/useMediaQuery"
import {IconMenu2, IconX} from "@tabler/icons-react"
import { useOutsideClick } from "@/hooks/useOutsideClick"

type NavItem = {
    title: string
    href: string
}

interface TabProps {
    setPosition: React.Dispatch<React.SetStateAction<{ left: number; width: number; opacity: number }>>
    onClick: () => void
    title: string
    textColor?: string
}

function Navigation() {
    const router = useRouter()
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const menuRef = useOutsideClick<HTMLElement>(() => setIsOpen(false))

    const [position, setPosition] = useState({ left: 0, width: 0, opacity: 0 })
    const [isScrolled, setIsScrolled] = useState(false)
    const [isOpen, setIsOpen] = useState(false)


    const headerItems: NavItem[] = [
        {title: "Home", href: ""},
        {title: "Product", href: ""},
        {title: "Contact", href: ""}
    ]

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 5)
            setIsOpen(false)
        }
        window.addEventListener("scroll", handleScroll)

        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const handleRoute = (item: NavItem) => {
        if (item.href) router.push(item.href)
        else router.replace("/")
    }

    if (!isDesktop) {
        return (
            <header
                className="fixed z-50 w-full overflow-hidden"
                ref={menuRef}
            >
                <motion.div
                    className={cn(
                        "my-4 p-1.5 flex flex-col gap-2 top-0 left-0 border rounded-2xl overflow-hidden transition-colors",
                        (isScrolled || isOpen) ? "border border-white/10 shadow-sm bg-primary/20 backdrop-blur-xl" : "border-transparent",
                    )}
                    initial={{
                        marginLeft: "6%",
                        marginRight: "6%",
                    }}
                    animate={{
                        marginLeft: isScrolled && !isOpen ? "10%" : "6%",
                        marginRight: isScrolled && !isOpen ? "10%" : "6%",
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 40,
                        damping: 10,
                    }}
                >
                    <div className={"w-full flex items-center justify-between gap-2"}>
                        <motion.div className={cn("flex")}
                                    initial={{opacity: 0, filter: 'blur(10px)', y: -30}}
                                    animate={{opacity: 1, filter: 'blur(0px)', y: 0}}
                                    transition={{duration: 0.65}}
                        >
                            <Image src={"/code0_logo_color.png"} width={"32"} height={"32"} alt={"Code0 Logo"}/>
                        </motion.div>
                        <motion.button
                            className={cn("bg-transparent border-0 transition-colors mr-1.5")}
                            initial={{opacity: 0, filter: 'blur(10px)', y: -30}}
                            animate={{opacity: 1, filter: 'blur(0px)', y: 0}}
                            transition={{duration: 0.65}}
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
                                {headerItems.map((item, i) => (
                                    <motion.div
                                        key={item.title}
                                        initial={{ y: -8, opacity: isScrolled ? 1 : 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -8, opacity: isScrolled ? 1 : 0 }}
                                        transition={{ duration: 0.25, delay: 0.06 * i }}
                                        className="text-white/75 px-2 py-1 font-medium text-md rounded-xl cursor-pointer hover:text-white hover:bg-white/10 transition-colors"
                                        onClick={() => {
                                            handleRoute(item)
                                            setIsOpen(false)
                                        }}
                                    >
                                        {item.title}
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </header>
        )
    }

    return (
        <div className={"fixed z-50 w-full overflow-hidden"}>
            <motion.div
                className={cn(
                    "my-4 p-1.5 flex flex-row items-center justify-between top-0 left-0 border rounded-2xl overflow-hidden transition-colors",
                    isScrolled ? "border border-white/10 shadow-sm bg-primary/20 backdrop-blur-xl" : "border-transparent",
                )}
                initial={{
                    marginLeft: "6%",
                    marginRight: "6%",
                }}
                animate={{
                    marginLeft: isScrolled ? "10%" : "6%",
                    marginRight: isScrolled ? "10%" : "6%",
                }}
                transition={{
                    type: "spring",
                    stiffness: 40,
                    damping: 10,
                }}
            >
                <motion.div className={cn("flex")}
                            initial={{opacity: 0, filter: 'blur(10px)', y: -30}}
                            animate={{opacity: 1, filter: 'blur(0px)', y: 0}}
                            transition={{duration: 0.65}}
                >
                    <Image src={"/code0_logo_color.png"} width={"32"} height={"32"} alt={"Code0 Logo"}/>
                </motion.div>

                <div className={"relative flex items-center pl-4"}
                     onMouseLeave={() => setPosition({ left: position.left, width: position.width, opacity: 0 })}
                >
                    <div className={"hidden md:flex gap-4"}>
                        {headerItems.map((item) => (
                            <Tab key={item.title}
                                 title={item.title}
                                 setPosition={setPosition}
                                 onClick={() => handleRoute(item)}
                            />
                        ))}
                    </div>
                    <Cursor position={position} />
                </div>
                <button
                    className={cn(
                        "flex items-center gap-2.5 px-4 h-8 rounded-xl transition-all",
                        "bg-primary/30 text-white/75 hover:text-white hover:bg-primary/50 cursor-pointer font-medium",
                    )}
                >
                    Discord
                </button>
            </motion.div>
        </div>
    )
}


const Tab: React.FC<TabProps> = ({ setPosition, onClick, title }) => {
    const ref = useRef<HTMLDivElement>(null)

    return (
        <motion.div
            className={cn("relative z-50 px-4 py-1 font-medium text-md rounded-xl cursor-pointer")}
            ref={ref}
            onClick={onClick}
            initial={{opacity: 0, filter: 'blur(10px)', y: -30}}
            animate={{opacity: 1, filter: 'blur(0px)', y: 0}}
            transition={{duration: 0.65}}
            onMouseEnter={() => {
                if (!ref?.current) return

                const { width } = ref.current.getBoundingClientRect()

                setPosition({
                    left: ref.current.offsetLeft,
                    width,
                    opacity: 1
                })
            }}
        >
            {title}
        </motion.div>
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

export { Navigation }