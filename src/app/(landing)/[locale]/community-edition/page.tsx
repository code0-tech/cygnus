import { CtaSection } from "@/components/sections/CtaSection"
import { EditionFeatureSection } from "@/components/sections/EditionFeatureSection"
import { EditionHeroSection } from "@/components/sections/EditionHeroSection"
import { EditionInstallSection } from "@/components/sections/EditionInstallSection"
import { EditionUseCaseSection } from "@/components/sections/EditionUseCaseSection"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { getLandingPage } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { getLandingPageMetadata } from "@/lib/pageMetadata"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params
    return getLandingPageMetadata("community-edition", locale)
}

export default async function CommunityEditionPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const page = await getLandingPage("community-edition", locale)
    const heroBlock = page?.layout?.find((item) => item.blockType === "editionHero") ?? null
    const featuresBlock = page?.layout?.find((item) => item.blockType === "editionFeatures") ?? null
    const installBlock = page?.layout?.find((item) => item.blockType === "editionInstall") ?? null
    const ctaBlock = page?.layout?.find((item) => item.blockType === "cta") ?? null

    return (
        <LandingContainer>
            <EditionHeroSection
                content={heroBlock}
                locale={locale}
                grainientColors={{
                    color1: "#10213a",
                    color2: "#f872e2",
                    color3: "#f8f172",
                    backgroundColor: "#0b1324",
                }}
            />
            <div className="h-32" aria-hidden="true" />
            <EditionFeatureSection content={featuresBlock} />
            <div className="h-32" aria-hidden="true" />
            <EditionInstallSection content={installBlock} />
            <div className="h-32" aria-hidden="true" />
            <EditionUseCaseSection />
            <div className="h-32" aria-hidden="true" />
            <CtaSection content={ctaBlock} />
        </LandingContainer>
    )
}
