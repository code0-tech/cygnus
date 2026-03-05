import { Navigation } from "@/components/navigation/Navigation"
import { SectionsProvider } from "@/components/providers/SectionsProvider"
import { FooterSection } from "@/components/sections/FooterSection"
import { getFooter } from "@/lib/cms"
import { getNavbarItems } from "@/lib/cms"
import { getSections } from "@/lib/cms"
import { SUPPORTED_LOCALES, isSupportedLocale } from "@/lib/i18n"
import type { ReactNode } from "react"
import { notFound } from "next/navigation"

interface LocaleLayoutProps {
    children: ReactNode
    params: Promise<{ locale: string }>
}

export function generateStaticParams() {
    return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export const revalidate = 300

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) {
        notFound()
    }

    const [items, footer, sections] = await Promise.all([
        getNavbarItems(locale),
        getFooter(locale),
        getSections(locale),
    ])

    return (
        <>
            <Navigation locale={locale} items={items} />
            <SectionsProvider sections={sections}>
                <div className="bg-primary">{children}</div>
            </SectionsProvider>
            <FooterSection locale={locale} footer={footer} />
        </>
    )
}
