import type { Footer, NavbarItem } from "@/payload-types"
import { type AppLocale } from "@/lib/i18n"
import { NavigationDesktop } from "./NavigationDesktop"
import { NavigationMobile } from "./NavigationMobile"

interface NavigationProps {
    locale: AppLocale
    items: NavbarItem[]
    footer: Footer | null
}

export function Navigation({ locale, items, footer }: NavigationProps) {
    return (
        <>
            <div className="hidden lg:block">
                <NavigationDesktop locale={locale} items={items} footer={footer} />
            </div>
            <div className="lg:hidden">
                <NavigationMobile locale={locale} items={items} footer={footer} />
            </div>
        </>
    )
}
