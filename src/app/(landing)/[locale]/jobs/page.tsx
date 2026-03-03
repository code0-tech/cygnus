import { JobsPageClient } from "@/components/pages/JobsPageClient"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { isSupportedLocale } from "@/lib/i18n"
import { getLandingPage, type JobsLayoutBlock } from "@/lib/cms"
import { getJobs } from "@/lib/cms"
import { notFound } from "next/navigation"

export default async function JobPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    if (!isSupportedLocale(locale)) notFound()

    const jobs = await getJobs(locale)
    const jobsPage = await getLandingPage("jobs", locale)
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
