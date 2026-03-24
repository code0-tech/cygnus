"use client"

import type { JobItem } from "@/lib/cms"
import { Card } from "@code0-tech/pictor"
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
            className="group block"
        >
            <Card
                variant="filled"
                className="glass-card-shell p-5!"
            >
                <div aria-hidden="true" className="glass-card-tint" />
                <div aria-hidden="true" className="glass-card-topline" />

                <div className="relative z-10">
                    <h3 className="text-2xl font-semibold tracking-tight text-white/92 mb-2">{job.title}</h3>
                    <p className="text-sm text-white/50 mb-4">
                        {job.location} - {job.type}
                    </p>
                    <p className="text-white/75 leading-6">{job.description}</p>
                </div>
            </Card>
        </Link>
    )
}
