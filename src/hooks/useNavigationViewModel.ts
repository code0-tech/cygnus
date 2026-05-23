"use client"

import { mapNavbarItems } from "@/lib/navigation"
import type { AppLocale } from "@/lib/i18n"
import type { Footer, NavbarItem } from "@/payload-types"
import { useMemo } from "react"

export function useNavigationViewModel(locale: AppLocale, items: NavbarItem[], footer: Footer | null) {
    return useMemo(() => ({
        homeHref: `/${locale}`,
        navbarItems: mapNavbarItems(items, locale),
        githubHref: footer?.socialLinks?.find((socialLink) => socialLink.platform === "github")?.url || "/",
        discordHref: footer?.socialLinks?.find((socialLink) => socialLink.platform === "discord")?.url || "/",
    }), [footer, items, locale])
}
