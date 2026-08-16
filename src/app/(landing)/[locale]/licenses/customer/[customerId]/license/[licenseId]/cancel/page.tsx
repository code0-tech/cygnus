import { LicenseCancelDialog } from "@/components/licenses/dialog/LicenseCancelDialog"
import { getErrorsContent, getLicenseContent } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"

export default async function LicenseCancelPage({ params }: { params: Promise<{ customerId: string; licenseId: string; locale: string }> }) {
    const { customerId, licenseId, locale } = await params
    if (!isSupportedLocale(locale)) notFound()
    const [content, errors] = await Promise.all([getLicenseContent(locale), getErrorsContent(locale)])
    if (!content || !errors) notFound()

    return <LicenseCancelDialog content={content} customerId={customerId} errors={errors} licenseId={licenseId} locale={locale} />
}
