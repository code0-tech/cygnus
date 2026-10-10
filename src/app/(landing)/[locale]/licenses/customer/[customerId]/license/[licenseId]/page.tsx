import { LicenseDetailPage } from "@/components/licenses/pages/LicenseDetailPage"
import { getErrorsContent, getLicenseContent, getSubscriptionConfig, getUpgradeBannerContent } from "@/lib/cms"
import { createMainAppLoginUrl } from "@/lib/checkout/checkoutLogin"
import { isSupportedLocale } from "@/lib/i18n"
import { createLicenseNamespaceCallbackUrl, createLicenseNamespaceReturnPath } from "@/lib/licenses/routes"
import { resolveSiteUrl } from "@/lib/siteConfig"
import { getClientConfig } from "@/lib/clientConfig.server"
import { notFound } from "next/navigation"

interface LicensePageProps {
    params: Promise<{ customerId: string; licenseId: string; locale: string }>
}

export default async function LicensePage({ params }: LicensePageProps) {
    const { customerId, licenseId, locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const [content, subscriptionConfig, upgradeBanner, errors] = await Promise.all([
        getLicenseContent(locale),
        getSubscriptionConfig(locale),
        getUpgradeBannerContent(locale),
        getErrorsContent(locale),
    ])
    if (!content || !errors) notFound()

    const siteUrl = resolveSiteUrl()
    const returnPath = createLicenseNamespaceReturnPath(locale, customerId, licenseId, "detail")
    const returnUrl = new URL(returnPath, siteUrl).toString()
    const callbackUrl = createLicenseNamespaceCallbackUrl(siteUrl, returnPath)
    const namespaceHref = createMainAppLoginUrl(getClientConfig().sculptorLoginUrl, callbackUrl, returnUrl, true)

    return (
        <LicenseDetailPage
            content={content}
            errors={errors}
            customerId={customerId}
            licenseId={licenseId}
            locale={locale}
            namespaceHref={namespaceHref}
            subscriptionConfig={subscriptionConfig}
            upgradeBanner={upgradeBanner}
        />
    )
}
