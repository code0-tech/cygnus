import ConsentManager from "@/components/providers/ConsentManager"
import { Navigation } from "@/components/navigation/Navigation"
import { FooterSection } from "@/components/sections/FooterSection"
import { getFooter } from "@/lib/cms"
import { getNavigation } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import type { ReactNode } from "react"
import { notFound } from "next/navigation"

interface LocaleLayoutProps {
    children: ReactNode
    params: Promise<{ locale: string }>
}

export const revalidate = 300

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) {
        notFound()
    }

    const [navigation, footer] = await Promise.all([getNavigation(locale), getFooter(locale)])
    const items = navigation?.items?.items ?? []
    const buttons = navigation?.buttons?.buttons ?? []
    const currentYear = new Date().getUTCFullYear()

    return (
        <ConsentManager locale={locale}>
            <div className="relative bg-primary overflow-x-hidden">
                <Navigation locale={locale} items={items} buttons={buttons} logo={navigation?.logo} />
                <main id="main-content" className="bg-primary">
                    {children}
                </main>
                <FooterSection locale={locale} footer={footer} currentYear={currentYear} />
            </div>
        </ConsentManager>
    )
}
