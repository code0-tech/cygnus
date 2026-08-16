import { LicenseBillingDialog } from "@/components/licenses/dialog/LicenseBillingDialog"
import { getErrorsContent, getLicenseContent, getSubscriptionConfig } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"

export default async function LicenseBillingPage({ params }: { params: Promise<{ customerId: string; licenseId: string; locale: string }> }) {
    const { customerId, licenseId, locale } = await params
    if (!isSupportedLocale(locale)) notFound()
    const [content, subscriptionConfig, errors] = await Promise.all([getLicenseContent(locale), getSubscriptionConfig(locale), getErrorsContent(locale)])
    if (!content || !subscriptionConfig || !errors) notFound()

    return <LicenseBillingDialog content={content} customerId={customerId} errors={errors} licenseId={licenseId} locale={locale} subscriptionConfig={subscriptionConfig} />
}
