import { LicenseEditDialog } from "@/components/licenses/dialog/LicenseEditDialog"
import { getCheckoutContent, getErrorsContent, getLicenseContent, getSubscriptionConfig } from "@/lib/cms"
import { createMainAppLoginUrl } from "@/lib/checkout/checkoutLogin"
import { isSupportedLocale } from "@/lib/i18n"
import { createLicenseNamespaceCallbackUrl, createLicenseNamespaceReturnPath } from "@/lib/licenses/licenseRoute"
import { resolveSiteUrl } from "@/lib/siteConfig"
import { notFound } from "next/navigation"

export default async function EditLicensePage({ params }: { params: Promise<{ customerId: string; licenseId: string; locale: string }> }) {
    const { customerId, licenseId, locale } = await params
    if (!isSupportedLocale(locale)) notFound()
    const [content, errors, checkoutContent, subscriptionConfig] = await Promise.all([getLicenseContent(locale), getErrorsContent(locale), getCheckoutContent(locale), getSubscriptionConfig(locale)])
    if (!content || !errors || !checkoutContent?.login || !subscriptionConfig) notFound()

    const siteUrl = resolveSiteUrl()
    const returnPath = createLicenseNamespaceReturnPath(locale, customerId, licenseId)
    const returnUrl = new URL(returnPath, siteUrl).toString()
    const callbackUrl = createLicenseNamespaceCallbackUrl(siteUrl, returnPath)
    const namespaceHref = createMainAppLoginUrl(checkoutContent.login.loginUrl, callbackUrl, returnUrl, true)

    return <LicenseEditDialog content={content} customerId={customerId} errors={errors} licenseId={licenseId} locale={locale} namespaceHref={namespaceHref} subscriptionConfig={subscriptionConfig} />
}
