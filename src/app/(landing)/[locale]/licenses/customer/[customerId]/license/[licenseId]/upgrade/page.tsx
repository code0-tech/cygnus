import { isSupportedLocale } from "@/lib/i18n"
import { createLicensePath } from "@/lib/licenses/licenseRoute"
import { notFound, redirect } from "next/navigation"

export default async function LicenseUpgradePage({ params }: { params: Promise<{ customerId: string; licenseId: string; locale: string }> }) {
    const { customerId, licenseId, locale } = await params
    if (!isSupportedLocale(locale)) notFound()
    redirect(`${createLicensePath(locale, customerId, licenseId)}/edit?tab=upgrade`)
}
