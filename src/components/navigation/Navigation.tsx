import type { NavbarItem } from "@/payload-types"
import { type AppLocale } from "@/lib/i18n"
import { NavigationDesktop } from "./NavigationDesktop"
import { NavigationMobile } from "./NavigationMobile"

interface NavigationProps {
    locale: AppLocale
    items: NavbarItem[]
}

export function Navigation({ locale, items }: NavigationProps) {
    return (
        <>
            <div className="hidden lg:block">
                <NavigationDesktop locale={locale} items={items} />
            </div>
            <div className="lg:hidden">
                <NavigationMobile locale={locale} items={items} />
            </div>
        </>
    )
}
