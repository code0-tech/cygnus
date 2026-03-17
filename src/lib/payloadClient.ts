import config from "@/payload.config"
import { cache } from "react"
import { getPayload } from "payload"

export const getPayloadClient = cache(async () => {
    return getPayload({ config })
})
