"use client"

import { useMediaQuery } from "@/hooks/useMediaQuery"
import { useOutsideClick } from "@/hooks/useOutsideClick"
import { getNavbarItems } from "@/utils/getNavbarItems"
import { IconCube, IconGitBranch, IconLock } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { JSX, useEffect, useMemo, useState } from "react"
import { NavigationDesktop } from "./NavigationDesktop"
import { NavigationMobile } from "./NavigationMobile"
import { NavItem, SubNavItem } from "./types"
import { NavbarItem } from "@/payload-types"

interface ExtendedSubNavItem {
    icon: JSX.Element
    color: string
}

function Navigation() {
    const router = useRouter()
    const isDesktop = useMediaQuery("(min-width: 1024px)")
    const menuRef = useOutsideClick<HTMLElement>(() => setIsOpen(false))
    const subMenuRef = useOutsideClick<HTMLDivElement>(() => setActiveSubMenu(null))

    const [position, setPosition] = useState({ left: 0, width: 0, opacity: 0 })
    const [isScrolled, setIsScrolled] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [activeSubMenu, setActiveSubMenu] = useState<SubNavItem[] | null>(null)
    const [mobileOpenKey, setMobileOpenKey] = useState<string | null>(null)

    const [items, setItems] = useState<NavbarItem[]>([])

    useEffect(() => {
      let active = true

      const load = async () => {
        const data = await getNavbarItems()
        if (active) setItems(data)
      }

      void load()
      return () => {
        active = false
      }
    }, [])

    const navbarItems = useMemo(() => {
        const iconMap: Record<string, ExtendedSubNavItem> = {
            features: { icon: <IconCube size={30} />, color: "pink" },
            integrations: { icon: <IconGitBranch size={30} />, color: "yellow" },
            security: { icon: <IconLock size={30} />, color: "aqua" },
        }

        return items.map((item) => {
            const mappedSubMenu = (item.subMenu ?? [])
                .filter((sub) => Boolean(sub?.title && sub?.href))
                .map((sub) => ({
                    ...sub,
                    icon: iconMap[sub.key]?.icon ?? null,
                    color: iconMap[sub.key]?.color ?? "brand",
                }))

            return {
                title: item.title,
                href: item.href ?? null,
                subMenu: mappedSubMenu.length > 0 ? mappedSubMenu : undefined,
            }
        })
    }, [items])

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
