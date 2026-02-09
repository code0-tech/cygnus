"use client"

import { useEffect, useState } from "react"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { useOutsideClick } from "@/hooks/useOutsideClick"
import { useRouter } from "@/i18n/navigation"
import { NavigationDesktop } from "./NavigationDesktop"
import { NavigationMobile } from "./NavigationMobile"
import { NavItem, SubNavItem } from "./types"
import { useNavbarItems } from "./useNavbarItems"

function Navigation() {
    const router = useRouter()
    const isDesktop = useMediaQuery("(min-width: 1024px)")
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
            <NavigationMobile
                menuRef={menuRef}
                isScrolled={isScrolled}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                navbarItems={navbarItems}
                mobileOpenKey={mobileOpenKey}
                setMobileOpenKey={setMobileOpenKey}
                handleRoute={handleRoute}
                onNavigate={(href) => router.push(href)}
            />
        )
    }

    return (
        <NavigationDesktop
            isScrolled={isScrolled}
            navbarItems={navbarItems}
            position={position}
            setPosition={setPosition}
            activeSubMenu={activeSubMenu}
            setActiveSubMenu={setActiveSubMenu}
            subMenuRef={subMenuRef}
            handleRoute={handleRoute}
            onNavigate={(href) => router.push(href)}
        />
    )
}

export { Navigation }
