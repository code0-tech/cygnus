import { LandingContainer } from "@/components/ui/LandingContainer"
import { isSupportedLocale } from "@/utils/i18n"
import { notFound } from "next/navigation"

export default async function PolicyPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    return (
        <LandingContainer>
            <p>Test</p>
        </LandingContainer>
    )
}
