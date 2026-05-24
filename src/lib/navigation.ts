import type { NavbarButton, NavbarItem } from "@/payload-types"
import { localizeHref, type AppLocale } from "@/lib/i18n"
import { getTablerIcon } from "@/lib/tablerIcons"
import * as SimpleIcons from "@icons-pack/react-simple-icons"
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

export type NavigationLinkVariant = "none" | "normal" | "outlined" | "filled"

export type NavbarButtonData = NavbarButton

export interface NavButton {
    title: string
    href: string
    icon: ReactNode
    newTab: boolean
    variant: NavigationLinkVariant
}

export const fadeInUp = {
    initial: { opacity: 0, y: -16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.65 },
}

type IconComponent = ComponentType<{ size?: number }>

const fallbackButtonIcon = TablerIcons.IconCube as IconComponent

function toPascalCase(value: string) {
    return value
        .trim()
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join("")
}

function getTablerButtonIcon(icon: string) {
    const normalizedIconName = `Icon${toPascalCase(icon.replace(/^icon/i, ""))}`

    if (!(normalizedIconName in TablerIcons)) return null

    return TablerIcons[normalizedIconName as keyof typeof TablerIcons] as unknown as IconComponent
}

function getSimpleButtonIcon(icon: string) {
    const normalizedIconName = `Si${toPascalCase(icon.replace(/^si/i, ""))}`

    if (!(normalizedIconName in SimpleIcons)) return null

    return SimpleIcons[normalizedIconName as keyof typeof SimpleIcons] as unknown as IconComponent
}

function getNavbarButtonIcon(icon: string | null | undefined, size = 20) {
    const trimmedIcon = icon?.trim()

    if (!trimmedIcon) return null

    const resolvedIcon = /^si/i.test(trimmedIcon)
        ? getSimpleButtonIcon(trimmedIcon)
        : getTablerButtonIcon(trimmedIcon)

    return createElement(resolvedIcon ?? fallbackButtonIcon, { size })
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

export function mapNavbarButtons(buttons: NavbarButtonData[], locale: AppLocale): NavButton[] {
    return buttons
        .filter((button) => Boolean(button.title && button.href))
        .map((button) => ({
            title: button.title,
            href: localizeHref(button.href, locale),
            icon: getNavbarButtonIcon(button.icon, 20),
            newTab: Boolean(button.newTab),
            variant: button.variant,
        }))
}
