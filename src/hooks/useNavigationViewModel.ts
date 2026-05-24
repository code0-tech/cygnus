"use client"

import { mapNavbarButtons, mapNavbarItems, type NavbarButtonData } from "@/lib/navigation"
import type { AppLocale } from "@/lib/i18n"
import type { NavbarItem } from "@/payload-types"
import { useMemo } from "react"

export function useNavigationViewModel(locale: AppLocale, items: NavbarItem[], buttons: NavbarButtonData[]) {
    return useMemo(() => ({
        homeHref: `/${locale}`,
        navbarItems: mapNavbarItems(items, locale),
        navbarButtons: mapNavbarButtons(buttons, locale),
    }), [buttons, items, locale])
}
