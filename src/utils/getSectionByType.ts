"use server"

import config from "@/payload.config"
import type { Section } from "@/payload-types"
import { DEFAULT_LOCALE, type AppLocale } from "@/utils/i18n"
import { getPayload } from "payload"

type SectionType = NonNullable<Section["sectionType"]>

export async function getSectionByType(sectionType: SectionType, locale: AppLocale = DEFAULT_LOCALE) {
    const payload = await getPayload({ config })

    const result = await payload.find({
        collection: "sections",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        where: {
            sectionType: {
                equals: sectionType,
            },
        },
        limit: 1,
        pagination: false,
    })

    return result.docs[0] ?? null
}
