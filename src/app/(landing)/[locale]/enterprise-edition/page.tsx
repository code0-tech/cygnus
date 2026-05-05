import { PageBlocks } from "@/components/PageBlockRenderer"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { getLandingPage } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { getLandingPageMetadata } from "@/lib/pageMetadata"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params
    return getLandingPageMetadata("enterprise-edition", locale)
}

export default async function EnterpriseEditionPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const page = await getLandingPage("enterprise-edition", locale)

    return (
        <LandingContainer>
            <div className="h-12 lg:h-16" aria-hidden="true" />
            <PageBlocks blocks={page?.layout} ctaFloating locale={locale} />
        </LandingContainer>
    )
}
