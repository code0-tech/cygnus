import { PageBlocks } from "@/components/ui/PageBlockRenderer"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { createLandingMetadata, getPageLocale, type LocalePageParams } from "@/lib/appRoute"
import { getLandingPage } from "@/lib/cms"
import { notFound } from "next/navigation"

export const generateMetadata = createLandingMetadata("contact")

export default async function ContactPage({ params }: { params: LocalePageParams }) {
    const locale = await getPageLocale(params)
    const page = await getLandingPage("contact", locale)
    if (!page) notFound()

    return (
        <LandingContainer>
            <div className="h-28" aria-hidden="true" />
            <PageBlocks blocks={page.layout} locale={locale} />
        </LandingContainer>
    )
}
