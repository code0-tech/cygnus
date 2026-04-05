import { CtaSection } from "@/components/sections/CtaSection"
import { EditionFeatureSection } from "@/components/sections/EditionFeatureSection"
import { EditionHeroSection } from "@/components/sections/EditionHeroSection"
import { EditionUseCaseSection } from "@/components/sections/EditionUseCaseSection"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { getLandingPage } from "@/lib/cms"
import type { CtaLayoutBlock } from "@/lib/cms"
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
    const heroBlock = page?.layout?.find((item) => item.blockType === "editionHero") ?? null
    const featuresBlock = page?.layout?.find((item) => item.blockType === "editionFeatures") ?? null
    const useCaseBlock = page?.layout?.find((item) => item.blockType === "editionUseCases") ?? null
    const ctaBlock = (page?.layout?.find((item) => item.blockType === "cta") ?? null) as CtaLayoutBlock | null

    return (
        <LandingContainer>
            <EditionHeroSection
                content={heroBlock}
                locale={locale}
                grainientColors={{
                    color1: "#13102d",
                    color2: "#7472f8",
                    color3: "#72c9f8",
                    backgroundColor: "#140c22",
                }}
            />
            <div className="h-32" aria-hidden="true" />
            <EditionFeatureSection content={featuresBlock} />
            <div className="h-32" aria-hidden="true" />
            <EditionUseCaseSection content={useCaseBlock} />
            <div className="h-32" aria-hidden="true" />
            <CtaSection content={ctaBlock} floatingCta locale={locale} />
        </LandingContainer>
    )
}
