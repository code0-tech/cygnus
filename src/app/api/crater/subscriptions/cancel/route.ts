import { CRATER_ERROR_FIELDS, craterJson, runCraterMutation, withCraterSession } from "@/lib/crater/api.server"
import { optionalString, readJsonObject, isSubscriptionId } from "@/lib/crater/request"
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
                immediateCancellationAvailable
                immediateCancellationUntil
                pendingUpdate { plan paymentPeriod aiTokens workflowExecutions effectiveAt }
                status
                updatedAt
            }
            errors {
                ...CraterErrorFields
            }
        }
    }
`

export const POST = withCraterSession({ log: "Crater subscription cancellation error", error: "Could not cancel the Crater subscription." }, async (request, token) => {
    const body = await readJsonObject(request)
    const id = optionalString(body?.id)
    if (!id || !isSubscriptionId(id)) {
        return craterJson({ error: "A valid Crater subscription id is required." }, 400)
    }
    const immediately = body?.immediately === true

    const mutation = await runCraterMutation(
        token,
        SUBSCRIPTIONS_CANCEL,
        { input: { id, ...(immediately ? { immediately } : {}) } },
        (data) => data.subscriptionsCancel,
        "Crater could not cancel the subscription."
    )
    if (mutation.response) return mutation.response
    if (!mutation.payload.subscription) throw new Error("Crater returned no cancelled subscription.")

    return craterJson(mutation.payload.subscription)
})
