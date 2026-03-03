import { AboutUsPageClient } from "@/components/pages/AboutUsPageClient"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { AboutUsLayoutBlock, getLandingPage } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { notFound } from "next/navigation"

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const aboutUsPage = await getLandingPage("about-us", locale)
    const aboutUsBlock = aboutUsPage?.layout?.find((block): block is AboutUsLayoutBlock => block.blockType === "about") ?? null

    return (
        <>
            <Aurora />
            <LandingContainer>
                <div className="md:w-[50vw] mx-auto py-[20vh]">
                    <AboutUsPageClient content={aboutUsBlock} locale={locale}/>
                </div>
            </LandingContainer>
        </>
    )
}
