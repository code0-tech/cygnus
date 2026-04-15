import type { NavbarItem } from "@/payload-types"
import { localizeHref, type AppLocale } from "@/lib/i18n"
import { getTablerIcon } from "@/lib/tablerIcons"
import { type ReactNode } from "react"

type NavItem = {
    title: string
    href: string | null
    subMenu?: SubNavItem[]
}

export type SubNavItem = {
    key: string
    title: string
    href: string
    description: string
    icon: ReactNode
}

export const fadeInUp = {
    initial: { opacity: 0, y: -16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.65 },
}

function getSubMenuIcon(icon: string | null | undefined) {
    return getTablerIcon(icon, 30)
}

export function mapNavbarItems(items: NavbarItem[], locale: AppLocale): NavItem[] {
    return items.map((item) => {
        const mappedSubMenu = (item.subMenu ?? [])
            .filter((sub) => Boolean(sub?.title && sub?.href && sub?.description))
            .map((sub) => ({
                ...sub,
                icon: getSubMenuIcon(sub.icon),
            }))

        return {
            title: item.title,
            href: item.href ? localizeHref(item.href, locale) : null,
            subMenu: mappedSubMenu.length > 0
                ? mappedSubMenu.map((sub) => ({ ...sub, href: localizeHref(sub.href, locale) }))
                : undefined,
        }
    })
}
