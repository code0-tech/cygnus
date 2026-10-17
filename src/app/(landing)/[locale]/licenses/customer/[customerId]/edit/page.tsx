import { CustomerEditDialog } from "@/components/licenses/dialog/customer/CustomerEditDialog"
import { getGlobal, getLicenseContent } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"

export default async function EditLicenseCustomerPage({ params }: { params: Promise<{ customerId: string; locale: string }> }) {
    const { customerId, locale } = await params
    if (!isSupportedLocale(locale)) notFound()
    const [content, checkoutContent, errors] = await Promise.all([getLicenseContent(locale), getGlobal("checkout", locale), getGlobal("errors", locale)])
    if (!content || !checkoutContent || !errors) notFound()

    return <CustomerEditDialog checkoutForm={checkoutContent.form} content={content} customerId={customerId} errors={errors} locale={locale} />
}
