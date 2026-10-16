import { LicenseDetailPage } from "@/components/licenses/pages/LicenseDetailPage"
import { getGlobal, getLicenseContent } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { createLicenseNamespaceReturnPath, createLicenseNamespaceStartPath } from "@/lib/licenses/routes"
import { notFound } from "next/navigation"

interface LicensePageProps {
    params: Promise<{ customerId: string; licenseId: string; locale: string }>
}

export default async function LicensePage({ params }: LicensePageProps) {
    const { customerId, licenseId, locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const [content, subscriptionConfig, errors] = await Promise.all([
        getLicenseContent(locale),
        getGlobal("subscriptionConfig", locale),
        getGlobal("errors", locale),
    ])
    if (!content || !errors) notFound()

    const namespaceHref = createLicenseNamespaceStartPath(createLicenseNamespaceReturnPath(locale, customerId, licenseId, "detail"))

    return (
        <LicenseDetailPage
            content={content}
            errors={errors}
            customerId={customerId}
            licenseId={licenseId}
            locale={locale}
            namespaceHref={namespaceHref}
            subscriptionConfig={subscriptionConfig}
        />
    )
}
