import { LicenseEditDialog } from "@/components/licenses/dialog/LicenseEditDialog"
import { getCheckoutContent, getErrorsContent, getLicenseContent } from "@/lib/cms"
import { createMainAppLoginUrl } from "@/lib/checkout/checkoutLogin"
import { isSupportedLocale } from "@/lib/i18n"
import { createLicenseNamespaceCallbackUrl, createLicenseNamespaceReturnPath } from "@/lib/licenses/licenseNamespaceSelection"
import { resolveSiteUrl } from "@/lib/siteConfig"
import { notFound } from "next/navigation"

export default async function EditLicensePage({ params }: { params: Promise<{ customerId: string; licenseId: string; locale: string }> }) {
    const { customerId, licenseId, locale } = await params
    if (!isSupportedLocale(locale)) notFound()
    const [content, errors, checkoutContent] = await Promise.all([getLicenseContent(locale), getErrorsContent(locale), getCheckoutContent(locale)])
    if (!content || !errors || !checkoutContent?.login) notFound()

    const siteUrl = resolveSiteUrl()
    const returnPath = createLicenseNamespaceReturnPath(locale, customerId, licenseId)
    const returnUrl = new URL(returnPath, siteUrl).toString()
    const callbackUrl = createLicenseNamespaceCallbackUrl(siteUrl, returnPath)
    const namespaceHref = createMainAppLoginUrl(checkoutContent.login.loginUrl, callbackUrl, returnUrl, true)

    return <LicenseEditDialog content={content} customerId={customerId} errors={errors} licenseId={licenseId} locale={locale} namespaceHref={namespaceHref} />
}
