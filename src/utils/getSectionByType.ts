"use server"

import config from "@/payload.config"
import type { Section } from "@/payload-types"
import { getPayload } from "payload"

type SectionType = NonNullable<Section["sectionType"]>

export async function getSectionByType(sectionType: SectionType) {
    const payload = await getPayload({ config })

    const result = await payload.find({
        collection: "sections",
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
