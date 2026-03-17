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
                className="relative overflow-hidden rounded-3xl! border! border-white/8! bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_28%,rgba(8,10,20,0.92)_100%)]! p-5! shadow-[0_18px_60px_rgba(0,0,0,0.25)]!"
            >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_40%)]" />
                <div className="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-aqua/14 blur-3xl transition-transform duration-700 group-hover:scale-115" />
                <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-aqua/14 via-blue/6 to-transparent opacity-90" />
                <div className="pointer-events-none absolute inset-0 opacity-[0.12] bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-position-[center_center] bg-size-[32px_32px] mask-[linear-gradient(180deg,rgba(0,0,0,0.75),transparent_92%)]" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(8,10,20,0),rgba(8,10,20,0.58)_58%,rgba(8,10,20,0.9))]" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />

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
