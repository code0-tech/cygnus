import { LicenseEditDialog } from "@/components/licenses/dialog/subscription/LicenseEditDialog"
import { getErrorsContent, getLicenseContent, getSubscriptionConfig } from "@/lib/cms"
import { createMainAppLoginUrl } from "@/lib/checkout/checkoutLogin"
import { isSupportedLocale } from "@/lib/i18n"
import { createLicenseNamespaceCallbackUrl, createLicenseNamespaceReturnPath } from "@/lib/licenses/routes"
import { resolveSiteUrl } from "@/lib/siteConfig"
import { getClientConfig } from "@/lib/clientConfig.server"
import { getCraterSubscriptionPrices } from "@/lib/subscription/prices.server"
import { notFound } from "next/navigation"

export default async function InterceptedLicenseEditPage({ params }: { params: Promise<{ customerId: string; licenseId: string; locale: string }> }) {
    const { customerId, licenseId, locale } = await params
    if (!isSupportedLocale(locale)) notFound()
    const [content, errors, subscriptionConfig, subscriptionPrices] = await Promise.all([
        getLicenseContent(locale),
        getErrorsContent(locale),
        getSubscriptionConfig(locale),
        getCraterSubscriptionPrices(),
    ])
    if (!content || !errors || !subscriptionConfig) notFound()

    const siteUrl = resolveSiteUrl()
    const returnPath = createLicenseNamespaceReturnPath(locale, customerId, licenseId)
    const returnUrl = new URL(returnPath, siteUrl).toString()
    const callbackUrl = createLicenseNamespaceCallbackUrl(siteUrl, returnPath)
    const namespaceHref = createMainAppLoginUrl(getClientConfig().sculptorLoginUrl, callbackUrl, returnUrl, true)

    return (
        <LicenseEditDialog
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
