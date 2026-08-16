import { LicenseLayout } from "@/components/licenses/LicenseLayout"
import { getErrorsContent, getLicenseContent } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
    title: { absolute: "CodeZero | License Dashboard" },
}

interface LicensesLayoutProps {
    children: ReactNode
    modal: ReactNode
    params: Promise<{ locale: string }>
}

export default async function LicensesLayout({ children, modal, params }: LicensesLayoutProps) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const [content, errors] = await Promise.all([getLicenseContent(locale), getErrorsContent(locale)])
    if (!content || !errors) notFound()

    return (
        <LicenseLayout content={content} errors={errors} locale={locale} modal={modal}>
            {children}
        </LicenseLayout>
    )
}
