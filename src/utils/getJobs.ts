"use server"

import config from "@/payload.config"
import { getPayload } from "payload"
import type { SerializedEditorState } from "lexical"
import { DEFAULT_LOCALE, type AppLocale } from "@/utils/i18n"

export interface JobItem {
    id: number
    title: string
    slug: string
    category: string
    type: string
    location: string
    description: string
    order?: number | null
}

export interface JobDetailItem extends JobItem {
    content: SerializedEditorState
}

export async function getJobs(locale: AppLocale = DEFAULT_LOCALE): Promise<JobItem[]> {
    const payload = await getPayload({ config })

    const result = await payload.find({
        collection: "jobs",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        sort: "order",
        pagination: false,
    })

    return (result.docs as unknown as JobItem[]) ?? []
}

export async function getJobBySlug(slug: string, locale: AppLocale = DEFAULT_LOCALE): Promise<JobDetailItem | null> {
    const payload = await getPayload({ config })

    const result = await payload.find({
        collection: "jobs",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        where: {
            slug: {
                equals: slug,
            },
        },
        limit: 1,
        pagination: false,
    })

    return (result.docs[0] as JobDetailItem | undefined) ?? null
}

export async function getJobSlugs(locale: AppLocale = DEFAULT_LOCALE): Promise<string[]> {
    const payload = await getPayload({ config })

    const result = await payload.find({
        collection: "jobs",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        pagination: false,
        limit: 1000,
    })

    return result.docs
        .map((job) => job.slug)
        .filter((slug): slug is string => typeof slug === "string" && slug.length > 0)
}
