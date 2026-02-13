import { Aurora } from "@/components/ui/Aurora"
import { JobsPageClient } from "@/components/jobs/JobsPageClient"
import { LandingContainer } from "@/components/ui/LandingContainer"
import { getJobs } from "@/utils/getJobs"

export default async function JobPage() {
    const jobs = await getJobs()

    return (
        <>
            <Aurora />
            <LandingContainer className="py-[20vh]">
                <JobsPageClient jobs={jobs} />
            </LandingContainer>
        </>
    )
}
