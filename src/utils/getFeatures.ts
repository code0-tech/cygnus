"use server"

import config from "@/payload.config"
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

export async function getFeatures() {
    const payload = await getPayload({ config })

    const result = await payload.find({
        collection: "features",
        pagination: false,
    })

    return (result.docs as unknown as FeatureItem[]) ?? []
}
