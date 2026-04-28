import { DeploymentImage } from "@/components/DeploymentImage"
import { PageBlocks } from "@/components/PageBlockRenderer"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { getLandingPage } from "@/lib/cms"
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
    if (!isSupportedLocale(locale)) notFound()

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
