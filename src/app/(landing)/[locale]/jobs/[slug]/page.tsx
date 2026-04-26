import { JobDetailContent } from "@/components/JobDetailContent"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { createMetadata } from "@/lib/siteConfig"
import { SUPPORTED_LOCALES, isSupportedLocale } from "@/lib/i18n"
import { getLandingPage, type JobsLayoutBlock } from "@/lib/cms"
import { getJobBySlug, getJobSlugs } from "@/lib/cms"
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export default async function JobDetailPage({ params }: { params: Promise<{ locale: string, slug: string }> }) {
    const { locale, slug } = await params
    if (!isSupportedLocale(locale)) notFound()
    if (!slug?.trim()) notFound()

    const job = await getJobBySlug(slug, locale)
    if (!job) notFound()

    const jobsPage = await getLandingPage("jobs", locale)
    const jobsBlock = jobsPage?.layout?.find((block): block is JobsLayoutBlock => block.blockType === "jobs") ?? null

    const contentHtml = convertLexicalToHTML({
        data: job.content,
        disableContainer: true,
    })

    return (
        <>
            <Aurora />
            <LandingContainer className="pt-32">
                <div className="mx-auto w-full max-w-5xl">
                    <JobDetailContent contentHtml={contentHtml} jobSlug={job.slug} jobsBlock={jobsBlock} locale={locale} />
                </div>
            </LandingContainer>
        </>
    )
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string, slug: string }> }): Promise<Metadata> {
    const { locale, slug } = await params
    if (!isSupportedLocale(locale)) return createMetadata()
    if (!slug?.trim()) return createMetadata()

    const job = await getJobBySlug(slug, locale)
    if (!job) return createMetadata()

    return createMetadata({
        title: job.title,
        description: job.description ?? undefined,
    })
}

export async function generateStaticParams() {
    const all = await Promise.all(
        SUPPORTED_LOCALES.map(async (locale) => {
            const slugs = await getJobSlugs(locale)
            return slugs.map((slug) => ({ locale, slug }))
        })
    )
    return all.flat()
}

export const dynamicParams = false
