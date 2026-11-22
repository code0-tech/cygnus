import ConsentManager from "@/components/providers/ConsentManager"
import { Navigation } from "@/components/navigation/Navigation"
import { FooterSection } from "@/components/sections/FooterSection"
import { getFooter } from "@/lib/cms"
import { getNavigation } from "@/lib/cms"
import { isSupportedLocale, type AppLocale } from "@/lib/i18n"
import type { ReactNode } from "react"
import { notFound } from "next/navigation"

interface LocaleLayoutProps {
    children: ReactNode
    params: Promise<{ locale: string }>
}

export const revalidate = 300

const SKIP_LINK_LABELS: Record<AppLocale, string> = {
    de: "Zum Inhalt springen",
    en: "Skip to content",
}

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
            <div className="relative bg-primary overflow-x-clip">
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary"
                >
                    {SKIP_LINK_LABELS[locale]}
                </a>
                <Navigation locale={locale} items={items} buttons={buttons} logo={navigation?.logo} />
                <main id="main-content" tabIndex={-1} className="bg-primary outline-none">
                    {children}
                </main>
                <FooterSection locale={locale} footer={footer} currentYear={currentYear} />
            </div>
        </ConsentManager>
    )
}
