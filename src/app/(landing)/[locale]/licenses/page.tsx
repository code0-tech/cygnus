import { LicenseDashboardPage } from "@/components/licenses/LicenseDashboardPage"
import { getLicenseContent } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"

export default async function LicensesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const licenses = await getLicenseContent(locale)
    if (!licenses) notFound()

    return <LicenseDashboardPage content={licenses} locale={locale} />
}
