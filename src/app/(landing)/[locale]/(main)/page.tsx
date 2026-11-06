import { DeploymentImage } from "@/components/ui/DeploymentImage"
import { PageBlocks } from "@/components/ui/PageBlockRenderer"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { createLandingMetadata, getPageLocale, type LocalePageParams } from "@/lib/appRoute"
import { getLandingPage } from "@/lib/cms"

export const generateMetadata = createLandingMetadata("main")

export default async function Page({ params }: { params: LocalePageParams }) {
    const locale = await getPageLocale(params)
    const page = await getLandingPage("main", locale)

    return (
        <LandingContainer>
            <div className="h-12 lg:h-16" aria-hidden="true" />
            <PageBlocks
                blocks={page?.layout}
                locale={locale}
                cardRowChildren={[
                    <DeploymentImage key="cloud" color="aqua" icon="cloud" text="Cloud" />,
                    <DeploymentImage key="selfhost" color="pink" icon="server" text="Selfhost" />,
                    <DeploymentImage key="dynamic" color="brand" icon="cloud-computing" text="Dynamic" />,
                ]}
            />
        </LandingContainer>
    )
}
