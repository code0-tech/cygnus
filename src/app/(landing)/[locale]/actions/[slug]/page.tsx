import { PageBlocks } from "@/components/PageBlockRenderer"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { fetchMediaJson } from "@/lib/actionExtraction"
import { getPageLocaleAndSlug, type LocaleSlugPageParams } from "@/lib/appRoute"
import { getActionBySlug, getLandingPage } from "@/lib/cms"
import { createMetadata } from "@/lib/siteConfig"
import type { Media } from "@/payload-types"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export default async function ActionDetailPage({ params }: { params: LocaleSlugPageParams }) {
    const { locale, slug } = await getPageLocaleAndSlug(params)
    const action = await getActionBySlug(slug, locale)
    if (!action) notFound()
    const actionsPage = await getLandingPage("action-details", locale)

    const module = action.module as Media | undefined
    const moduleJson = await fetchMediaJson(module).catch(() => null)
    const references = (action.references ?? []).filter((reference): reference is Exclude<typeof reference, number> => typeof reference !== "number")
    const tags = (action.tags ?? []).filter((tag): tag is string => Boolean(tag))

    return (
        <>
            <Aurora />
            <LandingContainer className="pt-16">
                <PageBlocks blocks={actionsPage?.layout} locale={locale} action={action} actionModuleJson={moduleJson} actionReferences={references as (typeof action)[]} />
            </LandingContainer>
        </>
    )
}

export async function generateMetadata({ params }: { params: LocaleSlugPageParams }): Promise<Metadata> {
    const { locale, slug } = await params
    if (!slug?.trim()) return createMetadata()
    if (locale !== "de" && locale !== "en") return createMetadata()

    const action = await getActionBySlug(slug, locale)
    if (!action) return createMetadata()

    return createMetadata({
        title: action.title,
        description: action.shortDescription ?? action.description ?? undefined,
    })
}
