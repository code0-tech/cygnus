"use server"

import config from "@/payload.config"
import type { Footer } from "@/payload-types"
import { DEFAULT_LOCALE, type AppLocale } from "@/utils/i18n"
import { getPayload } from "payload"

export async function getFooter(locale: AppLocale = DEFAULT_LOCALE) {
    const payload = await getPayload({ config })

    const result = await payload.find({
        collection: "footer",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        pagination: false,
        limit: 1,
    })

    return (result.docs[0] as Footer | undefined) ?? null
}
