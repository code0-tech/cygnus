import type { NavbarItem } from "@/payload-types"
import { localizeHref, type AppLocale } from "@/lib/i18n"
import * as TablerIcons from "@tabler/icons-react"
import { createElement, type ComponentType, type ReactNode } from "react"

export type NavItem = {
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
    const fallbackIcon = TablerIcons.IconCube as ComponentType<{ size?: number }>
    const normalizedIconName = `Icon${(icon ?? "cube")
        .trim()
        .replace(/^icon/i, "")
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join("")}`

    const resolvedIcon = normalizedIconName in TablerIcons
        ? TablerIcons[normalizedIconName as keyof typeof TablerIcons] as unknown as ComponentType<{ size?: number }>
        : fallbackIcon

    return createElement(resolvedIcon, { size: 30 })
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
