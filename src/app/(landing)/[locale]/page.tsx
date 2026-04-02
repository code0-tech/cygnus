import { LandingContainer } from "@/components/ui/LandingContainer"
import { HeroSection } from "@/components/sections/HeroSection"
import { BrandSection } from "@/components/sections/BrandSection"
import { UseCaseSection } from "@/components/sections/UseCaseSection"
import { AppFeatureSection } from "@/components/sections/AppFeatureSection"
import { DeploymentSection } from "@/components/sections/DeploymentSection"
import { RuntimeFeatureSection } from "@/components/sections/RuntimeFeatureSection"
import { RoadmapSection } from "@/components/sections/RoadmapSection"
import { FaqSection } from "@/components/sections/FaqSection"
import { CtaSection } from "@/components/sections/CtaSection"
import { getLandingPage } from "@/lib/cms"
import type { DeploymentLayoutBlock, HeroLayoutBlock } from "@/lib/cms"
import type { BrandLayoutBlock } from "@/lib/cms"
import type { CtaLayoutBlock } from "@/lib/cms"
import type { FaqLayoutBlock } from "@/lib/cms"
import type { UseCaseLayoutBlock } from "@/lib/cms"
import { isSupportedLocale, SUPPORTED_LOCALES } from "@/lib/i18n"
import { getLandingPageMetadata } from "@/lib/pageMetadata"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export function generateStaticParams() {
    return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params
    return getLandingPageMetadata("main", locale)
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) {
        notFound()
    }

    const page = await getLandingPage("main", locale)
    const layout = page?.layout ?? []
    const heroBlock = layout.find((block): block is HeroLayoutBlock => block.blockType === "hero") ?? null
    const brandBlock = layout.find((block): block is BrandLayoutBlock => block.blockType === "brand") ?? null
    const useCaseBlock = layout.find((block): block is UseCaseLayoutBlock => block.blockType === "usecase") ?? null
    const faqBlock = layout.find((block): block is FaqLayoutBlock => block.blockType === "faq") ?? null
    const ctaBlock = layout.find((block): block is CtaLayoutBlock => block.blockType === "cta") ?? null
    const deploymentBlock = layout.find((block): block is DeploymentLayoutBlock => block.blockType === "deployment") ?? null

    return (
        <LandingContainer>
            <HeroSection content={heroBlock} />
            <BrandSection content={brandBlock} />
            <div className="h-32" aria-hidden="true" />
            <UseCaseSection content={useCaseBlock} />
            <div className="h-32" aria-hidden="true" />
            <AppFeatureSection locale={locale} />
            <div className="h-32" aria-hidden="true" />
            <DeploymentSection content={deploymentBlock} />
            <div className="h-32" aria-hidden="true" />
            <RuntimeFeatureSection locale={locale} />
            <div className="h-32" aria-hidden="true" />
            <RoadmapSection locale={locale} />
            <div className="h-32" aria-hidden="true" />
            <FaqSection content={faqBlock} />
            <CtaSection content={ctaBlock} />
        </LandingContainer>
    )
}
