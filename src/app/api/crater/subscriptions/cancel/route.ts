import { createApolloClient } from "@/lib/apolloClient"
import { CRATER_ERROR_FIELDS, craterJson, craterMutationErrorResponse, craterTransportErrorResponse, optionalString, readJsonObject, requireCraterSession } from "@/lib/checkout/craterApi"
import { isSubscriptionId } from "@/lib/licenses/craterSubscriptionRequest"
import type { Mutation, MutationSubscriptionsCancelArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type SubscriptionsCancelData = Pick<Mutation, "subscriptionsCancel">

const SUBSCRIPTIONS_CANCEL: TypedDocumentNode<SubscriptionsCancelData, MutationSubscriptionsCancelArgs> = gql`
    ${CRATER_ERROR_FIELDS}
    mutation SubscriptionsCancel($input: SubscriptionsCancelInput!) {
        subscriptionsCancel(input: $input) {
            subscription {
                cancelAt
                canceledAt
                id
                status
                updatedAt
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
    const immediately = body?.immediately === true

    try {
        const result = await createApolloClient(session.token).mutate({
            mutation: SUBSCRIPTIONS_CANCEL,
            variables: { input: { id, ...(immediately ? { immediately } : {}) } },
        })
        const payload = result.data?.subscriptionsCancel
        if (!payload) throw new Error("Crater returned no subscription cancellation payload.")

        const errorResponse = craterMutationErrorResponse(payload.errors, "Crater could not cancel the subscription.")
        if (errorResponse) return errorResponse
        if (!payload.subscription) throw new Error("Crater returned no cancelled subscription.")

        return craterJson(payload.subscription)
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater subscription cancellation error:", error)
        return craterJson({ error: "Could not cancel the Crater subscription." }, 502)
    }
}
