"use server"

import config from "@/payload.config"
import { DEFAULT_LOCALE, type AppLocale } from "@/utils/i18n"
import { getPayload } from "payload"

export type FeatureSlug =
    | "welcome-user"
    | "pro-subscription"
    | "team-subscription"
    | "role-system"
    | "member-management"
    | "organizations"
    | "suggestion-menu"
    | "node-tabs"
    | "runtime-types"
    | "action-list"

export interface FeatureItem {
    id: number
    slug: FeatureSlug
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

export async function getFeatureBySlug(slug: FeatureSlug, locale: AppLocale = DEFAULT_LOCALE) {
    const payload = await getPayload({ config })

    const result = await payload.find({
        collection: "features",
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

    return (result.docs[0] as unknown as FeatureItem | undefined) ?? null
}
