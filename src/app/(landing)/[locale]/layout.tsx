import ConsentManager from "@/components/providers/ConsentManager"
import { Navigation } from "@/components/navigation/Navigation"
import { FooterSection } from "@/components/sections/FooterSection"
import { getFooter } from "@/lib/cms"
import { getNavbarItems } from "@/lib/cms"
import { getSections } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import type { ReactNode } from "react"
import { notFound } from "next/navigation"

interface LocaleLayoutProps {
    children: ReactNode
    params: Promise<{ locale: string }>
}

export const revalidate = 300
export const dynamic = "force-dynamic"

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) {
        notFound()
    }

    const [items, footer] = await Promise.all([
        getNavbarItems(locale),
        getFooter(locale),
    ])

    return (
        <ConsentManager locale={locale}>
            <div className="relative bg-primary overflow-x-hidden">
                <Navigation locale={locale} items={items} footer={footer} />
                <main id="main-content" className="bg-primary">
                    {children}
                </main>
                <FooterSection locale={locale} footer={footer} />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center" aria-hidden="true">
                    <div className="h-16 w-full bg-blue/20 blur-3xl" />
                </div>
            </div>
        </ConsentManager>
    )
}
