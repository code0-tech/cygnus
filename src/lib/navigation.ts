import "server-only"

import type { Navigation } from "@/payload-types"
import { localizeHref, type AppLocale } from "@/lib/i18n"
import { getTablerIcon } from "@/lib/tablerIcons"
import type { ReactNode } from "react"

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

type NavigationLinkVariant = "none" | "normal" | "outlined" | "filled"

export type NavigationData = Navigation
export type NavigationLogoData = Navigation["logo"]
export type NavbarItemData = Navigation["items"]["items"][number]
export type NavbarButtonData = Navigation["buttons"]["buttons"][number]

export interface NavButton {
    title: string
    href: string
    icon: ReactNode
    newTab: boolean
    variant: NavigationLinkVariant
}

function getNavbarButtonIcon(icon: string | null | undefined, size = 20) {
    const trimmedIcon = icon?.trim()

    if (!trimmedIcon) return null

    return getTablerIcon(trimmedIcon, size)
}

function getSubMenuIcon(icon: string | null | undefined) {
    return getTablerIcon(icon, 30)
}

export function mapNavbarItems(items: NavbarItemData[], locale: AppLocale): NavItem[] {
    const sortedItems = items.toSorted((left, right) => left.order - right.order)
    const navbarItems: NavItem[] = []

    for (const item of sortedItems) {
        const mappedSubMenu: SubNavItem[] = []

        for (const sub of item.subMenu ?? []) {
            if (!sub?.title || !sub.href || !sub.description) continue
            mappedSubMenu.push({
                ...sub,
                href: localizeHref(sub.href, locale),
                icon: getSubMenuIcon(sub.icon),
            })
        }

        navbarItems.push({
            title: item.title,
            href: item.href ? localizeHref(item.href, locale) : null,
            subMenu: mappedSubMenu.length > 0 ? mappedSubMenu : undefined,
        })
    }

    return navbarItems
}

export function mapNavbarButtons(buttons: NavbarButtonData[], locale: AppLocale): NavButton[] {
    const sortedButtons = buttons.toSorted((left, right) => left.order - right.order)
    const navbarButtons: NavButton[] = []

    for (const button of sortedButtons) {
        if (!button.title || !button.href) continue
        navbarButtons.push({
            title: button.title,
            href: localizeHref(button.href, locale),
            icon: getNavbarButtonIcon(button.icon, 20),
            newTab: Boolean(button.newTab),
            variant: button.variant,
        })
    }

    return navbarButtons
}
