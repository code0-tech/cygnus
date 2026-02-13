import type { JobItem } from "@/utils/getJobs"
import Link from "next/link"

interface JobsCardProps {
    job: JobItem
}

export function JobsCard({ job }: JobsCardProps) {
    return (
        <Link href={`/jobs/${job.slug}`} className={"bg-white/10 p-4 rounded-lg shadow-md block hover:bg-white/15 transition-colors"}>
            <h3 className={"text-2xl font-semibold mb-2"}>{job.title}</h3>
            <p className={"text-sm text-gray-400 mb-4"}>
                {job.location} - {job.type}
            </p>
            <p className={"text-white/75"}>{job.description}</p>
        </Link>
    )
}
