import { LandingContainer } from "@/components/ui/LandingContainer"
import { HeroSection } from "@/components/sections/HeroSection"
import { getLandingPage } from "@/utils/getLandingPage"
import type { DeploymentLayoutBlock, HeroLayoutBlock } from "@/utils/getLandingPage"
import type { BrandLayoutBlock } from "@/utils/getLandingPage"
import type { CtaLayoutBlock } from "@/utils/getLandingPage"
import type { FaqLayoutBlock } from "@/utils/getLandingPage"
import type { UseCaseLayoutBlock } from "@/utils/getLandingPage"
import { isSupportedLocale, SUPPORTED_LOCALES } from "@/utils/i18n"
import dynamic from "next/dynamic"
import { notFound } from "next/navigation"

const BrandSection = dynamic(() => import("@/components/sections/BrandSection").then((mod) => mod.BrandSection))
const UseCaseSection = dynamic(() => import("@/components/sections/UseCaseSection").then((mod) => mod.UseCaseSection))
const AppFeatureSection = dynamic(() => import("@/components/sections/AppFeatureSection").then((mod) => mod.AppFeatureSection))
const DeploymentSection = dynamic(() => import("@/components/sections/DeploymentSection").then((mod) => mod.DeploymentSection))
const RuntimeFeatureSection = dynamic(() => import("@/components/sections/RuntimeFeatureSection").then((mod) => mod.RuntimeFeatureSection))
const RoadmapSection = dynamic(() => import("@/components/sections/RoadmapSection").then((mod) => mod.RoadmapSection))
const FaqSection = dynamic(() => import("@/components/sections/FaqSection").then((mod) => mod.FaqSection))
const CtaSection = dynamic(() => import("@/components/sections/CtaSection").then((mod) => mod.CtaSection))

export function generateStaticParams() {
    return SUPPORTED_LOCALES.map((locale) => ({ locale }))
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
            <UseCaseSection content={useCaseBlock} />
            <AppFeatureSection locale={locale} />
            <DeploymentSection content={deploymentBlock} />
            <RuntimeFeatureSection />
            <RoadmapSection />
            <FaqSection content={faqBlock} />
            <CtaSection content={ctaBlock} />
        </LandingContainer>
    )
}
