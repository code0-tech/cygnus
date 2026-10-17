import { getLicenseContent } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"

export default async function LicensesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const licenses = await getLicenseContent(locale)

    return <div className="flex min-h-dvh flex-col"></div>
}
