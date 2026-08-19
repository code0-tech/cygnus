import { LicenseUpgradeDialog } from "@/components/licenses/dialog/LicenseUpgradeDialog"
import { getErrorsContent, getLicenseContent, getSubscriptionConfig } from "@/lib/cms"
import { getCraterSubscriptionPrices } from "@/lib/craterSubscriptionPrices"
import { isSupportedLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"

export default async function InterceptedLicenseUpgradePage({ params }: { params: Promise<{ customerId: string; licenseId: string; locale: string }> }) {
    const { customerId, licenseId, locale } = await params
    if (!isSupportedLocale(locale)) notFound()
    const [content, subscriptionConfig, errors, subscriptionPrices] = await Promise.all([
        getLicenseContent(locale),
        getSubscriptionConfig(locale),
        getErrorsContent(locale),
        getCraterSubscriptionPrices(),
    ])
    if (!content || !subscriptionConfig || !errors) notFound()

    return (
        <LicenseUpgradeDialog
            content={content}
            customerId={customerId}
            errors={errors}
            licenseId={licenseId}
            locale={locale}
            subscriptionConfig={subscriptionConfig}
            subscriptionPrices={subscriptionPrices}
        />
    )
}
