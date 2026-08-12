import { LicenseDashboardPage } from "@/components/licenses/LicenseDashboardPage"
import { getLicenseContent } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"

export default async function LicensesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const content = await getLicenseContent(locale)
    if (!content) notFound()

    return <LicenseDashboardPage content={content} locale={locale} />
}
