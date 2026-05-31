import { ActionsPageClient } from "@/components/ActionsPageClient"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { createLandingMetadata, getPageLocale, type LocalePageParams } from "@/lib/appRoute"
import { getActions, getLandingPage } from "@/lib/cms"
import { findPageBlock } from "@/lib/pageBlocks"

export const generateMetadata = createLandingMetadata("actions")

export default async function ActionsPage({ params }: { params: LocalePageParams }) {
    const locale = await getPageLocale(params)
    const [actions, actionsPage] = await Promise.all([
        getActions(locale),
        getLandingPage("actions", locale),
    ])
    const actionsBlock = findPageBlock(actionsPage, "actions")

    return (
        <>
            <Aurora />
            <LandingContainer className="pt-32">
                <ActionsPageClient actions={actions} locale={locale} content={actionsBlock} />
            </LandingContainer>
        </>
    )
}
