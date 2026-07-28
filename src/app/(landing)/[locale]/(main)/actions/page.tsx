import { LandingContainer } from "@/components/ui/LandingContainer"
import { PageBlocks } from "@/components/ui/PageBlockRenderer"
import { createLandingMetadata, getPageLocale, type LocalePageParams } from "@/lib/appRoute"
import { getActions, getLandingPage } from "@/lib/cms"

export const generateMetadata = createLandingMetadata("actions")

export default async function ActionsPage({ params }: { params: LocalePageParams }) {
    const locale = await getPageLocale(params)
    const [actions, actionsPage] = await Promise.all([getActions(locale), getLandingPage("actions", locale)])

    return (
        <LandingContainer>
            <div className="h-12 lg:h-16" aria-hidden="true" />
            <PageBlocks blocks={actionsPage?.layout} actions={actions} locale={locale} />
        </LandingContainer>
    )
}
