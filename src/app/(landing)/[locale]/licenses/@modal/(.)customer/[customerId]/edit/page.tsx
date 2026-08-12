import { CustomerEditDialog } from "@/components/licenses/dialog/CustomerEditDialog"
import { getLicenseContent } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"

export default async function InterceptedCustomerEditPage({ params }: { params: Promise<{ customerId: string; locale: string }> }) {
    const { customerId, locale } = await params
    if (!isSupportedLocale(locale)) notFound()
    const content = await getLicenseContent(locale)
    if (!content) notFound()

    return <CustomerEditDialog content={content} customerId={customerId} locale={locale} />
}
