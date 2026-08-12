import { LicenseLayout } from "@/components/licenses/LicenseLayout"
import { getLicenseContent } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

interface LicensesLayoutProps {
    children: ReactNode
    modal: ReactNode
    params: Promise<{ locale: string }>
}

export default async function LicensesLayout({ children, modal, params }: LicensesLayoutProps) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const content = await getLicenseContent(locale)
    if (!content) notFound()

    return <LicenseLayout content={content} locale={locale} modal={modal}>{children}</LicenseLayout>
}
