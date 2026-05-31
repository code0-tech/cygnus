import type { NavbarItem } from "@/payload-types"
import { type AppLocale } from "@/lib/i18n"
import type { NavbarButtonData } from "@/lib/navigation"
import { NavigationDesktop } from "./NavigationDesktop"
import { NavigationMobile } from "./NavigationMobile"

interface NavigationProps {
    locale: AppLocale
    items: NavbarItem[]
    buttons: NavbarButtonData[]
}

export function Navigation({ locale, items, buttons }: NavigationProps) {
    return (
        <>
            <div className="hidden lg:block">
                <NavigationDesktop locale={locale} items={items} buttons={buttons} />
            </div>
            <div className="lg:hidden">
                <NavigationMobile locale={locale} items={items} buttons={buttons} />
            </div>
        </>
    )
}
