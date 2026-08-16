import { CustomerEditDialog } from "@/components/licenses/dialog/CustomerEditDialog"
import { getCheckoutContent, getErrorsContent, getLicenseContent } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"

export default async function EditLicenseCustomerPage({ params }: { params: Promise<{ customerId: string; locale: string }> }) {
    const { customerId, locale } = await params
    if (!isSupportedLocale(locale)) notFound()
    const [content, checkoutContent, errors] = await Promise.all([getLicenseContent(locale), getCheckoutContent(locale), getErrorsContent(locale)])
    if (!content || !checkoutContent || !errors) notFound()

    return <CustomerEditDialog checkoutForm={checkoutContent.form} content={content} customerId={customerId} errors={errors} locale={locale} />
}
