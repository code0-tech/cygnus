import { LandingContainer } from "@/components/ui/LandingContainer"
import { PageBlocks } from "@/components/ui/PageBlockRenderer"
import { createLandingMetadata, getPageLocale, type LocalePageParams } from "@/lib/appRoute"
import { getLandingPage, getPaginatedActions } from "@/lib/cms"

export const generateMetadata = createLandingMetadata("actions")

export default async function ActionsPage({ params }: { params: LocalePageParams }) {
    const locale = await getPageLocale(params)
    const [paginatedActions, actionsPage] = await Promise.all([getPaginatedActions(locale, { page: 1, limit: 18 }), getLandingPage("actions", locale)])

    return (
        <LandingContainer>
            <div className="h-12 lg:h-16" aria-hidden="true" />
            <PageBlocks blocks={actionsPage?.layout} paginatedActions={paginatedActions} locale={locale} />
        </LandingContainer>
    )
}
