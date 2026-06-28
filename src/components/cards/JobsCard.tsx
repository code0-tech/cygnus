"use client"

import type { JobItem } from "@/lib/cms"
import Link from "next/link"
import { useWebHaptics } from "web-haptics/react"
import { Card } from "../ui/Card"

interface JobsCardProps {
    job: JobItem
    locale: string
}

export function JobsCard({ job, locale }: JobsCardProps) {
    const { trigger } = useWebHaptics()

    return (
        <Link href={`/${locale}/jobs/${job.slug}`} onClick={() => trigger("medium")} className="group block">
            <Card variant="light" size="lg" className="transition-colors group-hover:bg-white/10">
                <div className="relative z-10">
                    <h3 className="text-2xl font-semibold tracking-tight text-white mb-2">{job.title}</h3>
                    <p className="text-sm text-tertiary mb-4">
                        {job.location} - {job.type}
                    </p>
                    <p className="text-secondary leading-6">{job.description}</p>
                </div>
            </Card>
        </Link>
    )
}
