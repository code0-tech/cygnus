"use client"

import type { NavbarItem } from "@/payload-types"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { useOutsideClick } from "@/hooks/useOutsideClick"
import { localizeHref, type AppLocale } from "@/lib/i18n"
import { IconCube, IconGitBranch, IconLock } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { NavigationDesktop } from "./NavigationDesktop"
import { NavigationMobile } from "./NavigationMobile"
import { NavItem, SubNavItem } from "./types"

type SubMenuIcon = "cube" | "gitBranch" | "lock"

interface NavigationProps {
    locale: AppLocale
    items: NavbarItem[]
}

function Navigation({ locale, items }: NavigationProps) {
    const router = useRouter()
    const isDesktop = useMediaQuery("(min-width: 1024px)")
    const menuRef = useOutsideClick<HTMLElement>(() => setIsOpen(false))
    const subMenuRef = useOutsideClick<HTMLDivElement>(() => setActiveSubMenu(null))

    const [position, setPosition] = useState({ left: 0, width: 0, opacity: 0 })
    const [isScrolled, setIsScrolled] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [activeSubMenu, setActiveSubMenu] = useState<SubNavItem[] | null>(null)
    const [mobileOpenKey, setMobileOpenKey] = useState<string | null>(null)
    const [disableIntroAnimation, setDisableIntroAnimation] = useState<boolean>(() => {
        if (typeof window === "undefined") return true
        return window.sessionStorage.getItem("nav-intro-seen") === "1"
    })
    const homeHref = `/${locale}`

    const navbarItems = useMemo(() => {
        const getSubMenuIcon = (icon: string | null | undefined) => {
            if (icon === "cube") return <IconCube size={30} />
            if (icon === "gitBranch") return <IconGitBranch size={30} />
            if (icon === "lock") return <IconLock size={30} />
            return null
        }

        return items.map((item) => {
            const mappedSubMenu = (item.subMenu ?? [])
                .filter((sub) => Boolean(sub?.title && sub?.href && sub?.description))
                .map((sub) => ({
                    ...sub,
                    icon: getSubMenuIcon((sub.icon as SubMenuIcon | null | undefined) ?? null),
                    color: sub.color ?? "brand",
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

    useEffect(() => {
        if (disableIntroAnimation) return
        window.sessionStorage.setItem("nav-intro-seen", "1")
        setDisableIntroAnimation(true)
    }, [disableIntroAnimation])

    const handleRoute = (item: NavItem) => {
        if (item.href) router.push(localizeHref(item.href, locale))
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
                onNavigate={(href) => router.push(localizeHref(href, locale))}
                homeHref={homeHref}
                disableIntroAnimation={disableIntroAnimation}
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
            onNavigate={(href) => router.push(localizeHref(href, locale))}
            homeHref={homeHref}
            disableIntroAnimation={disableIntroAnimation}
        />
    )
}

export { Navigation }
