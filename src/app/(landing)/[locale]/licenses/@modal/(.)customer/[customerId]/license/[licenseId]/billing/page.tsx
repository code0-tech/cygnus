import { LicenseBillingDialog } from "@/components/licenses/dialog/LicenseBillingDialog"
import { getLicenseContent, getSubscriptionConfig } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"

export default async function InterceptedLicenseBillingPage({ params }: { params: Promise<{ customerId: string; licenseId: string; locale: string }> }) {
    const { customerId, licenseId, locale } = await params
    if (!isSupportedLocale(locale)) notFound()
    const [content, subscriptionConfig] = await Promise.all([getLicenseContent(locale), getSubscriptionConfig(locale)])
    if (!content || !subscriptionConfig) notFound()

    return <LicenseBillingDialog content={content} customerId={customerId} licenseId={licenseId} locale={locale} subscriptionConfig={subscriptionConfig} />
}
