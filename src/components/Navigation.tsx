"use client"

import {AnimatePresence, motion} from "motion/react"
import {Link, useRouter} from "@/i18n/navigation"
import React, {JSX, ReactNode, useEffect, useMemo, useRef, useState} from "react"
import {cn} from "@/utils/cn"
import Image from "next/image"
import {useMediaQuery} from "@/hooks/useMediaQuery"
import {IconBrandGithub, IconChevronUp, IconCube, IconGitBranch, IconLock, IconMenu2, IconX} from "@tabler/icons-react"
import {useOutsideClick} from "@/hooks/useOutsideClick"
import {useWindowWidth} from "@/hooks/useWindowWidth"
import {useTranslations} from "next-intl"

type NavItem = {
    title: string
    href: string | null
    subMenu?: SubNavItem[]
}

type SubNavItem = {
    key: string
    title: string
    href: string
    description: string
    icon: ReactNode
}

interface TabProps {
    setPosition: React.Dispatch<React.SetStateAction<{ left: number; width: number; opacity: number }>>
    subMenu?: SubNavItem[]
    activeSubMenu?: SubNavItem[] | null
    onClick: () => void
    onMouseEnter: () => void
    title: string
    textColor?: string
}

function Navigation() {
    const router = useRouter()
    const isDesktop = useMediaQuery("(min-width: 1024px)")
    const width = useWindowWidth()
    const navbarItems = useNavbarItems()
    const menuRef = useOutsideClick<HTMLElement>(() => setIsOpen(false))
    const subMenuRef = useOutsideClick<HTMLDivElement>(() => setActiveSubMenu(null))

    const [position, setPosition] = useState({ left: 0, width: 0, opacity: 0 })
    const [isScrolled, setIsScrolled] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [activeSubMenu, setActiveSubMenu] = useState<SubNavItem[] | null>(null)
    const [mobileOpenKey, setMobileOpenKey] = useState<string | null>(null)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 5)
            setActiveSubMenu(null)
            setIsOpen(false)
        }
        window.addEventListener("scroll", handleScroll)

        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const handleRoute = (item: NavItem) => {
        if (item.href) router.push(item.href)
        else router.replace("")
    }

    if (!isDesktop) {
        return (
            <header
                className="fixed z-50 w-full overflow-hidden"
                ref={menuRef}
            >
                <motion.div
                    className={cn(
                        "my-6 p-1.5 flex flex-col gap-2 top-0 left-0 border rounded-2xl overflow-hidden transition-colors",
                        (isScrolled || isOpen) ? "border border-white/5 shadow-sm bg-primary/20 backdrop-blur-xl" : "border-transparent",
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
                        <Link href="/">
                            <motion.div className={cn("flex")}
                                initial={{opacity: 0, filter: 'blur(10px)', y: -30}}
                                animate={{opacity: 1, filter: 'blur(0px)', y: 0}}
                                transition={{duration: 0.65}}
                            >
                                <Image src={"/code0_logo_white.png"} width={"32"} height={"32"} alt={"Code0 Logo"}/>
                            </motion.div>
                        </Link>
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
                                                                            router.push(sub.href)
                                                                            setIsOpen(false)
                                                                            setMobileOpenKey(null)
                                                                        }}
                                                                    >
                                                                        <div className="p-1 rounded-lg border border-dashed border-white/20 group-hover:bg-brand/10 group-hover:border-brand/50 text-gray-400 group-hover:text-brand">{sub.icon}</div>
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
                                <motion.div
                                    key={"Github"}
                                    initial={{ y: -8, opacity: isScrolled ? 1 : 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -8, opacity: isScrolled ? 1 : 0 }}
                                    transition={{ duration: 0.25, delay: 0.06 * 4 }}
                                    className="mt-4 p-2 font-medium text-md rounded-xl cursor-pointer hover:text-white hover:bg-white/10 transition-colors border border-white/10"
                                    onClick={() => {
                                        router.push("github")
                                        setIsOpen(false)
                                    }}
                                >
                                    {"Github"}
                                </motion.div>
                                <motion.div
                                    key={"Discord"}
                                    initial={{ y: -8, opacity: isScrolled ? 1 : 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -8, opacity: isScrolled ? 1 : 0 }}
                                    transition={{ duration: 0.25, delay: 0.06 * 4 }}
                                    className="text-white/75 p-2 font-medium text-md rounded-xl cursor-pointer hover:text-white hover:bg-white/10 transition-colors border border-white/10"
                                    onClick={() => {
                                        router.push("discord")
                                        setIsOpen(false)
                                    }}
                                >
                                    {"Discord"}
                                </motion.div>

                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </header>
        )
    }

    return (
        <div className={"fixed z-[100] h-max w-full"}>
            <motion.div
                className={cn(
                    "my-4 p-1.5 flex flex-col justify-center gap-2 lg:gap-4 top-0 left-0 border rounded-2xl overflow-visible",
                    isScrolled ? "border border-white/5 shadow-sm bg-primary/20 backdrop-blur-xl" : "border-transparent",
                )}
                initial={{
                    marginLeft: "4.5%",
                    marginRight: "4.5%",
                }}
                animate={{
                    marginLeft: isScrolled ? (width < 1024 ? "28%" : "22%") : "4.5%",
                    marginRight: isScrolled ? (width < 1024 ? "28%" : "22%") : "4.5%"
                }}
                transition={{
                    type: "spring",
                    stiffness: 40,
                    damping: 10,
                }}
            >
                <div className={"w-full h-full flex items-center justify-between gap-2"}>

                    <Link href="/">
                        <motion.div className={cn("flex")}
                            initial={{opacity: 0, filter: 'blur(10px)', y: -30}}
                            animate={{opacity: 1, filter: 'blur(0px)', y: 0}}
                            transition={{duration: 0.65}}
                        >
                            <Image src={"/code0_logo_white.png"} width={"32"} height={"32"} alt={"Code0 Logo"}/>
                        </motion.div>
                    </Link>

                    <div className={"relative h-full flex items-center"}
                         onMouseLeave={() => setPosition({ left: position.left, width: position.width, opacity: 0 })}
                    >
                        <div className={"hidden md:flex gap-2"}>
                            {navbarItems.map((item) => (
                                <Tab key={item.title}
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
                                    {activeSubMenu.map((subItem) => (
                                        <motion.div
                                            key={subItem.title}
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            transition={{ duration: 0.2 }}
                                            className="group h-14 flex items-center gap-3 p-2 rounded-md hover:bg-white/10 cursor-pointer"
                                            onClick={() => {
                                                router.push(subItem.href)
                                                setActiveSubMenu(null)
                                            }}
                                        >
                                            <div className="p-1 border border-dashed border-white/20 group-hover:bg-brand/10 group-hover:border-brand/50 text-gray-400 group-hover:text-brand rounded-lg">{subItem.icon}</div>
                                            <div className="flex flex-col">
                                                <p className="text-white font-medium">{subItem.title}</p>
                                                <p className="text-white/75 text-sm">{subItem.description}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className={"flex items-center gap-2"}>
                        <button
                            className={cn(
                                "flex items-center px-4 h-8 rounded-xl transition-all",
                                "bg-transparent hover:bg-white/10 cursor-pointer font-medium text-white/75 hover:text-white/75",
                            )}
                        >
                            <IconBrandGithub/>
                        </button>
                        <button
                            className={cn(
                                "flex items-center px-4 h-8 rounded-xl transition-all",
                                "bg-white/90 hover:bg-white cursor-pointer font-medium text-primary ring ring-white/20",
                            )}
                        >
                            Discord
                        </button>
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
                            {activeSubMenu.map((subItem) => (
                                <motion.div
                                    key={subItem.title}
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.2 }}
                                    className="group h-14 flex items-center gap-1 p-2 rounded-lg hover:bg-white/10 cursor-pointer"
                                    onClick={() => {
                                        router.push(subItem.href)
                                        setActiveSubMenu(null)
                                    }}
                                >
                                    <div className="p-1 border border-dashed border-white/20 group-hover:bg-brand/10 group-hover:border-brand/50 text-gray-400 group-hover:text-brand rounded-lg">{subItem.icon}</div>
                                    <div className="flex flex-col">
                                        <p className="text-white font-medium">{subItem.title}</p>
                                        <p className="text-white/75 text-sm">{subItem.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

            </motion.div>
        </div>
    )
}


const Tab: React.FC<TabProps> = ({ setPosition, onClick, title, subMenu, activeSubMenu, onMouseEnter }) => {
    const ref = useRef<HTMLDivElement>(null)
    const active = activeSubMenu && activeSubMenu === subMenu

    return (
        <motion.div
            className={cn("relative z-50 flex items-center gap-2 px-4 py-1 font-medium text-md rounded-xl cursor-pointer", subMenu && "pr-1")}
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
                onMouseEnter()
            }}
        >
            {title}
            {subMenu && (
                active ? (
                    <IconChevronUp size={20} className={"transition-all text-white/75 mr-1"}/>
                ) : (
                    <IconChevronUp size={20} className={"rotate-180 transition-all text-white/75 mr-1"}/>
                )
            )}
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

export const useNavbarItems = () => {
    const t = useTranslations("Navbar")

    return useMemo(() => {
        const items = t.raw("items") as NavItem[]

        const iconMap: Record<string, JSX.Element> = {
            features: <IconCube size={30} />,
            integrations: <IconGitBranch size={30} />,
            security: <IconLock size={30} />
        }

        return items.map(item => ({
            ...item,
            subMenu: item.subMenu?.map(sub => ({
                ...sub,
                icon: iconMap[sub.key] ?? null
            }))
        }))
    }, [t])
}

export { Navigation }
