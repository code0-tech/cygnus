"use server"

import { getPayload } from "payload"
import config from "@/payload.config"

export async function getNavbarItems() {
    const payload = await getPayload({ config })

    const result = await payload.find({
        collection: "navbarItems",
        pagination: false,
        sort: "order"
    })

    return result.docs
}
