import { type AppLocale } from "@/lib/i18n"
import { mapNavbarButtons, mapNavbarItems, type NavigationLogoData, type NavbarButtonData, type NavbarItemData } from "@/lib/navigation"
import { NavigationDesktop } from "./NavigationDesktop"
import { NavigationMobile } from "./NavigationMobile"

interface NavigationProps {
    locale: AppLocale
    items: NavbarItemData[]
    buttons: NavbarButtonData[]
    logo?: NavigationLogoData
}

export function Navigation({ locale, items, buttons, logo }: NavigationProps) {
    const homeHref = `/${locale}`
    const navbarItems = mapNavbarItems(items, locale)
    const navbarButtons = mapNavbarButtons(buttons, locale)

    return (
        <>
            <div className="hidden lg:block">
                <NavigationDesktop homeHref={homeHref} items={navbarItems} buttons={navbarButtons} logo={logo} />
            </div>
            <div className="lg:hidden">
                <NavigationMobile homeHref={homeHref} items={navbarItems} buttons={navbarButtons} logo={logo} />
            </div>
        </>
    )
}
