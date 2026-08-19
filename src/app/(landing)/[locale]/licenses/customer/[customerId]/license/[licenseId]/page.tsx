import { LicenseDetailPage } from "@/components/licenses/pages/LicenseDetailPage"
import { getCheckoutContent, getLicenseContent, getSubscriptionConfig } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"

interface LicensePageProps {
    params: Promise<{ customerId: string; licenseId: string; locale: string }>
}

export default async function LicensePage({ params }: LicensePageProps) {
    const { customerId, licenseId, locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const [content, checkoutContent, subscriptionConfig] = await Promise.all([getLicenseContent(locale), getCheckoutContent(locale), getSubscriptionConfig(locale)])
    if (!content) notFound()

    return (
        <LicenseDetailPage
            content={content}
            customerId={customerId}
            licenseId={licenseId}
            locale={locale}
            subscriptionConfig={subscriptionConfig}
            upgradeBanner={checkoutContent?.upgradeBanner}
        />
    )
}
