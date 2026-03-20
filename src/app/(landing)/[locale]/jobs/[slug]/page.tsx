import { MarkdownContent } from "@/components/MarkdownContent"
import { JobApplicationCard } from "@/components/cards/JobApplicationCard"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { SUPPORTED_LOCALES, isSupportedLocale } from "@/lib/i18n"
import { getLandingPage, type JobsLayoutBlock } from "@/lib/cms"
import { getJobBySlug, getJobSlugs } from "@/lib/cms"
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html"
import { notFound } from "next/navigation"

export default async function JobDetailPage({ params }: { params: Promise<{ locale: string, slug: string }> }) {
    const { locale, slug } = await params
    if (!isSupportedLocale(locale)) notFound()

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
            <LandingContainer className="py-[20vh]">
                <div className={"w-full md:w-[50vw] mx-auto"}>
                    <MarkdownContent content={contentHtml} />
                    <div className="mt-10">
                        <JobApplicationCard jobSlug={job.slug} content={jobsBlock} locale={locale} />
                    </div>
                </div>
            </LandingContainer>
        </>
    )
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
