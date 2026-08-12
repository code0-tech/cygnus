import { LicenseCustomerPage } from "@/components/licenses/LicenseCustomerPage"
import { getLicenseContent } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"

interface CustomerPageProps {
    params: Promise<{ customerId: string; locale: string }>
}

export default async function CustomerPage({ params }: CustomerPageProps) {
    const { customerId, locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const content = await getLicenseContent(locale)
    if (!content) notFound()

    return <LicenseCustomerPage content={content} customerId={customerId} locale={locale} />
}
