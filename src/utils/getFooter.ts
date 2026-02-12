"use server"

import config from "@/payload.config"
import type { Footer } from "@/payload-types"
import { getPayload } from "payload"

export async function getFooter() {
    const payload = await getPayload({ config })

    const result = await payload.find({
        collection: "footer",
        pagination: false,
        limit: 1,
    })

    return (result.docs[0] as Footer | undefined) ?? null
}
