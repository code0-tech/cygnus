import { ActionsPageClient } from "@/components/ActionsPageClient"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { getActions, getLandingPage, type ActionsLayoutBlock } from "@/lib/cms"
import { isSupportedLocale } from "@/lib/i18n"
import { getLandingPageMetadata } from "@/lib/pageMetadata"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params
    return getLandingPageMetadata("actions", locale)
}

export default async function ActionsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const [actions, actionsPage] = await Promise.all([
        getActions(locale),
        getLandingPage("actions", locale),
    ])
    const actionsBlock = actionsPage?.layout?.find((block): block is ActionsLayoutBlock => block.blockType === "actions") ?? null

    return (
        <>
            <Aurora />
            <LandingContainer className="pt-32">
                <ActionsPageClient actions={actions} locale={locale} content={actionsBlock} />
            </LandingContainer>
        </>
    )
}
