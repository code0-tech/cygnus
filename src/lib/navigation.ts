import "server-only"

import type { Navigation } from "@/payload-types"
import { localizeHref, type AppLocale } from "@/lib/i18n"
import { getIcon } from "@/components/ui/IconRenderer"
import type { ReactNode } from "react"

export type NavItem = {
    title: string
    href: string | null
    subMenuGroups?: SubNavGroup[]
    shortLinkGroups?: ShortLinkGroup[]
}

export type SubNavItem = {
    key: string
    title: string
    href: string
    description: string
    icon: ReactNode
}

export type SubNavGroup = {
    key: string
    title: string
    items: SubNavItem[]
}

export type ShortLink = {
    key: string
    title: string
    href: string
    newTab: boolean
}

export type ShortLinkGroup = {
    key: string
    title: string
    links: ShortLink[]
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

    return getIcon(trimmedIcon, size)
}

function getSubMenuIcon(icon: string | null | undefined) {
    return getIcon(icon, 30)
}

export function mapNavbarItems(items: NavbarItemData[], locale: AppLocale): NavItem[] {
    const sortedItems = items.toSorted((left, right) => left.order - right.order)
    const navbarItems: NavItem[] = []

    for (const item of sortedItems) {
        const subMenuGroups: SubNavGroup[] = (item.subMenuGroups ?? []).flatMap((group, groupIndex) => {
            const mappedItems: SubNavItem[] = (group.items ?? []).flatMap((sub) => {
                if (!sub?.title || !sub.href || !sub.description) return []

                return [{
                    key: sub.key,
                    title: sub.title,
                    href: localizeHref(sub.href, locale),
                    description: sub.description,
                    icon: getSubMenuIcon(sub.icon),
                }]
            })

            if (mappedItems.length === 0) return []
            return [{ key: group.id ?? `submenu-group-${groupIndex}`, title: group.title, items: mappedItems }]
        })
        const shortLinkGroups: ShortLinkGroup[] = (item.shortLinkGroups ?? []).flatMap((group, groupIndex) => {
            const links: ShortLink[] = (group.links ?? []).flatMap((link, linkIndex) => {
                if (!link?.title || !link.href) return []

                return [{
                    key: link.id ?? `short-link-${linkIndex}`,
                    title: link.title,
                    href: localizeHref(link.href, locale),
                    newTab: Boolean(link.newTab),
                }]
            })

            if (links.length === 0) return []
            return [{ key: group.id ?? `short-link-group-${groupIndex}`, title: group.title, links }]
        })

        navbarItems.push({
            title: item.title,
            href: item.href ? localizeHref(item.href, locale) : null,
            subMenuGroups: subMenuGroups.length > 0 ? subMenuGroups : undefined,
            shortLinkGroups: shortLinkGroups.length > 0 ? shortLinkGroups : undefined,
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
