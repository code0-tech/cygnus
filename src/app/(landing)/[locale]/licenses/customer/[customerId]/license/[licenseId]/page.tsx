import { LicenseDetailPage } from "@/components/licenses/pages/LicenseDetailPage"
import { getCheckoutContent, getLicenseContent, getSubscriptionConfig, getUpgradeBannerContent } from "@/lib/cms"
import { createMainAppLoginUrl } from "@/lib/checkout/checkoutLogin"
import { isSupportedLocale } from "@/lib/i18n"
import { createLicenseNamespaceCallbackUrl, createLicenseNamespaceReturnPath } from "@/lib/licenses/licenseNamespaceSelection"
import { resolveSiteUrl } from "@/lib/siteConfig"
import { notFound } from "next/navigation"

interface LicensePageProps {
    params: Promise<{ customerId: string; licenseId: string; locale: string }>
}

export default async function LicensePage({ params }: LicensePageProps) {
    const { customerId, licenseId, locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const [content, checkoutContent, subscriptionConfig, upgradeBanner] = await Promise.all([
        getLicenseContent(locale),
        getCheckoutContent(locale),
        getSubscriptionConfig(locale),
        getUpgradeBannerContent(locale),
    ])
    if (!content || !checkoutContent?.login) notFound()

    const siteUrl = resolveSiteUrl()
    const returnPath = createLicenseNamespaceReturnPath(locale, customerId, licenseId, "detail")
    const returnUrl = new URL(returnPath, siteUrl).toString()
    const callbackUrl = createLicenseNamespaceCallbackUrl(siteUrl, returnPath)
    const namespaceHref = createMainAppLoginUrl(checkoutContent.login.loginUrl, callbackUrl, returnUrl, true)

    return (
        <LicenseDetailPage
            content={content}
            customerId={customerId}
            licenseId={licenseId}
            locale={locale}
            namespaceHref={namespaceHref}
            subscriptionConfig={subscriptionConfig}
            upgradeBanner={upgradeBanner}
        />
    )
}
