"use server"

import config from "@/payload.config"
import { DEFAULT_LOCALE, type AppLocale } from "@/utils/i18n"
import { getPayload } from "payload"

export interface FeatureItem {
    id: number
    title: string
    description: string
    link: {
        label: string
        url: string
    }
}

export async function getFeatures(locale: AppLocale = DEFAULT_LOCALE) {
    const payload = await getPayload({ config })

    const result = await payload.find({
        collection: "features",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        pagination: false,
    })

    return (result.docs as unknown as FeatureItem[]) ?? []
}
