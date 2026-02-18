import { JobsPageClient } from "@/components/JobsPageClient"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { isSupportedLocale } from "@/utils/i18n"
import { getLandingPage, type JobsLayoutBlock } from "@/utils/getLandingPage"
import { getJobs } from "@/utils/getJobs"
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
