"use client"

import { mapNavbarButtons, mapNavbarItems, type NavbarButtonData, type NavbarItemData, type NavigationLogoData } from "@/lib/navigation"
import type { AppLocale } from "@/lib/i18n"
import { useMemo } from "react"

export function useNavigationViewModel(locale: AppLocale, items: NavbarItemData[], buttons: NavbarButtonData[], logo?: NavigationLogoData) {
    return useMemo(
        () => ({
            homeHref: `/${locale}`,
            navbarItems: mapNavbarItems(items, locale),
            navbarButtons: mapNavbarButtons(buttons, locale),
            logo,
        }),
        [buttons, items, locale, logo]
    )
}
