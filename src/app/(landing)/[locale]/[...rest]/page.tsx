import { PageBlocks } from "@/components/ui/PageBlockRenderer"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { getCustomLandingPage } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { getCustomLandingPageMetadata } from "@/lib/pageMetadata"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

type CatchAllPageParams = Promise<{ locale: string; rest: string[] }>

async function getCatchAllParams(params: CatchAllPageParams) {
    const { locale, rest } = await params
    if (!isSupportedLocale(locale) || rest.length !== 1 || !rest[0]?.trim()) notFound()

    return { locale, slug: rest[0] }
}

export default async function CustomLandingPage({ params }: { params: CatchAllPageParams }) {
    const { locale, slug } = await getCatchAllParams(params)
    const page = await getCustomLandingPage(slug, locale)
    if (!page) notFound()

    return (
        <LandingContainer>
            <div className="h-12 lg:h-16" aria-hidden="true" />
            <PageBlocks blocks={page.layout} locale={locale} />
        </LandingContainer>
    )
}

export async function generateMetadata({ params }: { params: CatchAllPageParams }): Promise<Metadata> {
    const { locale, slug } = await getCatchAllParams(params)
    return getCustomLandingPageMetadata(slug, locale)
}
