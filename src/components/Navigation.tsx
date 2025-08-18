"use client"

import { motion } from "motion/react"
import { useRouter } from "next/navigation"
import type React from "react"
import {useEffect, useRef, useState} from "react"
import {cn} from "@/utils/cn"
import Image from "next/image"
import {Button} from "@code0-tech/pictor"

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
    const [position, setPosition] = useState({ left: 0, width: 0, opacity: 0 })
    const [isScrolled, setIsScrolled] = useState(false)

    const headerItems: NavItem[] = [
        {title: "Home", href: ""},
        {title: "Product", href: ""},
        {title: "Contact", href: ""}
    ]

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 5)
        }
        window.addEventListener("scroll", handleScroll)

        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const handleRoute = (item: NavItem) => {
        if (item.href) router.push(item.href)
        else router.replace("/")
    }

    return (
        <div className={"fixed z-50 w-full overflow-hidden"}>
            <motion.div
                className={cn(
                    "my-4 p-1.5 flex flex-row items-center justify-between top-0 left-0 rounded-2xl",
                    "border border-white/10 shadow-sm bg-primary/20 backdrop-blur-xl overflow-hidden",
                )}
                initial={{
                    marginLeft: "12%",
                    marginRight: "12%",
                }}
                animate={{
                    marginLeft: isScrolled ? "16%" : "12%",
                    marginRight: isScrolled ? "16%" : "12%",
                }}
                transition={{
                    type: "spring",
                    stiffness: 120,
                    damping: 20,
                }}
            >
                <motion.div className={cn("flex")}
                            initial={{opacity: 0, filter: 'blur(10px)', y: -30}}
                            animate={{opacity: 1, filter: 'blur(0px)', y: 0}}
                            transition={{duration: 0.65}}
                >
                    <Image src={"/code0_logo.png"} width={"30"} height={"30"} alt={"Code0 Logo"}/>
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