import { JobsPageClient } from "@/components/JobsPageClient"
import { Aurora } from "@/components/ui/Aurora"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { createLandingMetadata, getPageLocale, type LocalePageParams } from "@/lib/appRoute"
import { getLandingPage, type JobsLayoutBlock } from "@/lib/cms"
import { getJobs } from "@/lib/cms"

export const generateMetadata = createLandingMetadata("jobs")

export default async function JobPage({ params }: { params: LocalePageParams }) {
    const locale = await getPageLocale(params)
    const [jobs, jobsPage] = await Promise.all([
        getJobs(locale),
        getLandingPage("jobs", locale),
    ])
    const jobsBlock = jobsPage?.layout?.find((block): block is JobsLayoutBlock => block.blockType === "jobs") ?? null

    return (
        <>
            <Aurora />
            <LandingContainer className="pt-32">
                <JobsPageClient jobs={jobs} locale={locale} content={jobsBlock} />
            </LandingContainer>
        </>
    )
}
