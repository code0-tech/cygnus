import { craterJson } from "@/lib/crater/api.server"
import { isSubscriptionId, optionalString, readJsonObject, type JsonObject } from "@/lib/crater/request"
import type { Scalars } from "@code0-tech/crater-graphql-types"
import type { NextResponse } from "next/server"

export async function readSubscriptionRequest(
    request: Request
): Promise<{ data: { id: Scalars["SubscriptionID"]["input"]; body: JsonObject }; response?: never } | { data?: never; response: NextResponse }> {
    const body = await readJsonObject(request)
    const id = optionalString(body?.id)
    if (!body || !id || !isSubscriptionId(id)) {
        return { response: craterJson({ error: "A valid Crater subscription id is required." }, 400) }
    }
    return { data: { id, body } }
}
