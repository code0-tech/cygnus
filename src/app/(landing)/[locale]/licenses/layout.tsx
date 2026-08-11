import { LicenseLayout } from "@/components/licenses/LicenseLayout"
import { isSupportedLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

interface LicensesLayoutProps {
    children: ReactNode
    params: Promise<{ locale: string }>
}

export default async function LicensesLayout({ children, params }: LicensesLayoutProps) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    return <LicenseLayout locale={locale}>{children}</LicenseLayout>
}
