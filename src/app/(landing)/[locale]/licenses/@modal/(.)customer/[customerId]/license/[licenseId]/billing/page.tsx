import { isSupportedLocale } from "@/lib/i18n"
import { notFound, redirect } from "next/navigation"

export default async function InterceptedLicenseBillingPage({ params }: { params: Promise<{ customerId: string; licenseId: string; locale: string }> }) {
    const { customerId, licenseId, locale } = await params
    if (!isSupportedLocale(locale)) notFound()
    redirect(`/${locale}/licenses/customer/${encodeURIComponent(customerId)}/license/${encodeURIComponent(licenseId)}/edit?tab=billing`)
}
