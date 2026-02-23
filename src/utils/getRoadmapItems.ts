"use server"

import config from "@/payload.config"
import { DEFAULT_LOCALE, type AppLocale } from "@/utils/i18n"
import { getPayload } from "payload"

export interface RoadmapItem {
    id: number
    time: string
    title: string
    description: string
}

export async function getRoadmapItems(locale: AppLocale = DEFAULT_LOCALE): Promise<RoadmapItem[]> {
    const payload = await getPayload({ config })

    const result = await payload.find({
        collection: "roadmapItems",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        pagination: false,
        sort: "-createdAt",
    })

    return (result.docs as unknown as RoadmapItem[]) ?? []
}
