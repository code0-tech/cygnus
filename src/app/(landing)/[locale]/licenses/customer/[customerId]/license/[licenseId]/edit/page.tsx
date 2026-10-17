import { LicenseEditDialog } from "@/components/licenses/dialog/subscription/LicenseEditDialog"
import { getGlobal, getLicenseContent } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { createLicenseNamespaceReturnPath, createLicenseNamespaceStartPath } from "@/lib/licenses/routes"
import { getCraterCheckoutPackages } from "@/lib/subscription/checkoutPackages.server"
import { getCraterSubscriptionPrices } from "@/lib/subscription/prices.server"
import { notFound } from "next/navigation"

export default async function EditLicensePage({ params }: { params: Promise<{ customerId: string; licenseId: string; locale: string }> }) {
    const { customerId, licenseId, locale } = await params
    if (!isSupportedLocale(locale)) notFound()
    const [content, errors, subscriptionConfig, subscriptionPrices, checkoutPackages] = await Promise.all([
        getLicenseContent(locale),
        getGlobal("errors", locale),
        getGlobal("subscriptionConfig", locale),
        getCraterSubscriptionPrices(),
        getCraterCheckoutPackages(),
    ])
    if (!content || !errors || !subscriptionConfig) notFound()

    const namespaceHref = createLicenseNamespaceStartPath(createLicenseNamespaceReturnPath(locale, customerId, licenseId))

    return (
        <LicenseEditDialog
            checkoutPackages={checkoutPackages}
            content={content}
            customerId={customerId}
            errors={errors}
            licenseId={licenseId}
            locale={locale}
            namespaceHref={namespaceHref}
            subscriptionConfig={subscriptionConfig}
            subscriptionPrices={subscriptionPrices}
        />
    )
}
