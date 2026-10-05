import { PageBlocks } from "@/components/ui/PageBlockRenderer"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { createLandingMetadata, getPageLocale, type LocalePageParams } from "@/lib/appRoute"
import { getLandingPage } from "@/lib/cms"

export const generateMetadata = createLandingMetadata("community-edition")

export default async function CommunityEditionPage({ params }: { params: LocalePageParams }) {
    const locale = await getPageLocale(params)
    const page = await getLandingPage("community-edition", locale)

    return (
        <LandingContainer>
            <div className="h-12 lg:h-16" aria-hidden="true" />
            <PageBlocks blocks={page?.layout} locale={locale} />
        </LandingContainer>
    )
}
