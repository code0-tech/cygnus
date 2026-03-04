"use client"

import type { JobItem } from "@/lib/cms"
import Link from "next/link"
import { useWebHaptics } from "web-haptics/react"

interface JobsCardProps {
    job: JobItem
    locale: string
}

export function JobsCard({ job, locale }: JobsCardProps) {
    const { trigger } = useWebHaptics()

    return (
        <Link
            href={`/${locale}/jobs/${job.slug}`}
            onClick={() => trigger("medium")}
            className={"bg-white/10 p-4 rounded-lg shadow-md block hover:bg-white/15 transition-colors"}
        >
            <h3 className={"text-2xl font-semibold mb-2"}>{job.title}</h3>
            <p className={"text-sm text-gray-400 mb-4"}>
                {job.location} - {job.type}
            </p>
            <p className={"text-white/75"}>{job.description}</p>
        </Link>
    )
}
