import { isSupportedLocale } from "@/lib/i18n"
import { createLicensePath } from "@/lib/licenses/routes"
import { notFound, redirect } from "next/navigation"

export default async function LicenseBillingPage({ params }: { params: Promise<{ customerId: string; licenseId: string; locale: string }> }) {
    const { customerId, licenseId, locale } = await params
    if (!isSupportedLocale(locale)) notFound()
    redirect(`${createLicensePath(locale, customerId, licenseId)}/edit?tab=general`)
}
