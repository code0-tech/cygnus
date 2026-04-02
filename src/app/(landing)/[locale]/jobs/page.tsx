import { JobsPageClient } from "@/components/JobsPageClient"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { isSupportedLocale } from "@/lib/i18n"
import { getLandingPage, type JobsLayoutBlock } from "@/lib/cms"
import { getJobs } from "@/lib/cms"
import { getLandingPageMetadata } from "@/lib/pageMetadata"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params
    return getLandingPageMetadata("jobs", locale)
}

export default async function JobPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const [jobs, jobsPage] = await Promise.all([
        getJobs(locale),
        getLandingPage("jobs", locale),
    ])
    const jobsBlock = jobsPage?.layout?.find((block): block is JobsLayoutBlock => block.blockType === "jobs") ?? null

    return (
        <>
            <Aurora />
            <LandingContainer className="py-[20vh]">
                <JobsPageClient jobs={jobs} locale={locale} content={jobsBlock} />
            </LandingContainer>
        </>
    )
}
