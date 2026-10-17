import { createApolloClient } from "@/lib/apolloClient"
import { CRATER_ERROR_FIELDS, craterJson, craterMutationErrorResponse, craterTransportErrorResponse, optionalString, readJsonObject, requireCraterSession } from "@/lib/checkout/craterApi"
import { isSubscriptionId, parseSubscriptionChangeFields } from "@/lib/licenses/craterSubscriptionRequest"
import type { Mutation, MutationSubscriptionsPreviewUpdateArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type SubscriptionsPreviewUpdateData = Pick<Mutation, "subscriptionsPreviewUpdate">

const SUBSCRIPTIONS_PREVIEW_UPDATE: TypedDocumentNode<SubscriptionsPreviewUpdateData, MutationSubscriptionsPreviewUpdateArgs> = gql`
    ${CRATER_ERROR_FIELDS}
    mutation SubscriptionsPreviewUpdate($input: SubscriptionsPreviewUpdateInput!) {
        subscriptionsPreviewUpdate(input: $input) {
            preview {
                aiTokens
                currency
                effectiveAt
                immediate
                paymentPeriod
                plan
                prorationAmount
                total
                workflowExecutions
            }
            errors {
                ...CraterErrorFields
            }
        }
    }
`

export async function POST(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    const body = await readJsonObject(request)
    const id = optionalString(body?.id)
    if (!id || !isSubscriptionId(id)) {
        return craterJson({ error: "A valid Crater subscription id is required." }, 400)
    }

    const fields = parseSubscriptionChangeFields(body)
    if ("error" in fields) return craterJson({ error: fields.error }, 400)

    try {
        const result = await createApolloClient(session.token).mutate({
            mutation: SUBSCRIPTIONS_PREVIEW_UPDATE,
            variables: { input: { id, ...fields } },
        })
        const payload = result.data?.subscriptionsPreviewUpdate
        if (!payload) throw new Error("Crater returned no subscription preview payload.")

        const errorResponse = craterMutationErrorResponse(payload.errors, "Crater could not preview the subscription change.")
        if (errorResponse) return errorResponse
        if (!payload.preview) throw new Error("Crater returned no subscription update preview.")

        return craterJson(payload.preview)
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater subscription preview error:", error)
        return craterJson({ error: "Could not preview the Crater subscription change." }, 502)
    }
}
