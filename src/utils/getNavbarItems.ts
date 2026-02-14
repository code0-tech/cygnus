"use server"

import { getPayload } from "payload"
import config from "@/payload.config"
import { DEFAULT_LOCALE, type AppLocale } from "@/utils/i18n"

export async function getNavbarItems(locale: AppLocale = DEFAULT_LOCALE) {
    const payload = await getPayload({ config })

    const result = await payload.find({
        collection: "navbarItems",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        pagination: false,
        sort: "order"
    })

    return result.docs
}
