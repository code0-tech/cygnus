import { JobsPageClient } from "@/components/JobsPageClient"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { createLandingMetadata, getPageLocale, type LocalePageParams } from "@/lib/appRoute"
import { getLandingPage } from "@/lib/cms"
import { getJobs } from "@/lib/cms"
import { findPageBlock } from "@/lib/pageBlocks"

export const generateMetadata = createLandingMetadata("jobs")

export default async function JobPage({ params }: { params: LocalePageParams }) {
    const locale = await getPageLocale(params)
    const [jobs, jobsPage] = await Promise.all([
        getJobs(locale),
        getLandingPage("jobs", locale),
    ])
    const jobsBlock = findPageBlock(jobsPage, "jobs")

    return (
        <LandingContainer className="pt-32">
                <JobsPageClient jobs={jobs} locale={locale} content={jobsBlock} />
        </LandingContainer>
    )
}
