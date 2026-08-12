import { LicenseEditDialog } from "@/components/licenses/LicenseEditDialog"
import { getLicenseContent } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"

export default async function InterceptedLicenseEditPage({ params }: { params: Promise<{ customerId: string; licenseId: string; locale: string }> }) {
    const { customerId, licenseId, locale } = await params
    if (!isSupportedLocale(locale)) notFound()
    const content = await getLicenseContent(locale)
    if (!content) notFound()

    return <LicenseEditDialog content={content} customerId={customerId} licenseId={licenseId} locale={locale} />
}
