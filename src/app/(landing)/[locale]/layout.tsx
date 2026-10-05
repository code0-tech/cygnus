import ConsentManager from "@/components/providers/ConsentManager"
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

    return (
        <ConsentManager locale={locale}>
            <div className="relative bg-primary overflow-x-hidden">
                <main id="main-content" className="bg-primary">
                    {children}
                </main>
            </div>
        </ConsentManager>
    )
}
