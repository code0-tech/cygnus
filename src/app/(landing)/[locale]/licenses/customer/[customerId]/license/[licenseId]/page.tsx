import { LicenseDetailPage } from "@/components/licenses/pages/LicenseDetailPage"
import { getLicenseContent } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"

interface LicensePageProps {
    params: Promise<{ customerId: string; licenseId: string; locale: string }>
}

export default async function LicensePage({ params }: LicensePageProps) {
    const { customerId, licenseId, locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const content = await getLicenseContent(locale)
    if (!content) notFound()

    return <LicenseDetailPage content={content} customerId={customerId} licenseId={licenseId} locale={locale} />
}
