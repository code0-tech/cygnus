import { JobDetailContent } from "@/components/JobDetailContent"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { getPageLocaleAndSlug, type LocaleSlugPageParams } from "@/lib/appRoute"
import { createMetadata } from "@/lib/siteConfig"
import { getLandingPage } from "@/lib/cms"
import { getJobBySlug } from "@/lib/cms"
import { findPageBlock } from "@/lib/pageBlocks"
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export default async function JobDetailPage({ params }: { params: LocaleSlugPageParams }) {
    const { locale, slug } = await getPageLocaleAndSlug(params)
    const job = await getJobBySlug(slug, locale)
    if (!job) notFound()

    const jobsPage = await getLandingPage("jobs", locale)
    const jobsBlock = findPageBlock(jobsPage, "jobs")

    const contentHtml = convertLexicalToHTML({
        data: job.content,
        disableContainer: true,
    })

    return (
        <LandingContainer className="pt-32">
                <div className="mx-auto w-full max-w-5xl">
                    <JobDetailContent contentHtml={contentHtml} jobSlug={job.slug} jobsBlock={jobsBlock} locale={locale} />
                </div>
        </LandingContainer>
    )
}

export async function generateMetadata({ params }: { params: LocaleSlugPageParams }): Promise<Metadata> {
    const { locale, slug } = await params
    if (!slug?.trim()) return createMetadata()
    if (locale !== "de" && locale !== "en") return createMetadata()

    const job = await getJobBySlug(slug, locale)
    if (!job) return createMetadata()

    return createMetadata({
        title: job.title,
        description: job.description ?? undefined,
    })
}

