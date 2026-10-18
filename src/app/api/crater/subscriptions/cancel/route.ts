import { SUBSCRIPTION_CANCELLATION_FIELDS } from "@/lib/crater/subscriptionFragments"
import { CRATER_ERROR_FIELDS, runCraterResourceMutation, withCraterSession } from "@/lib/crater/api.server"
import { readSubscriptionRequest } from "@/lib/crater/subscriptionRequests.server"
import type { Mutation, MutationSubscriptionsCancelArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type SubscriptionsCancelData = Pick<Mutation, "subscriptionsCancel">

const SUBSCRIPTIONS_CANCEL: TypedDocumentNode<SubscriptionsCancelData, MutationSubscriptionsCancelArgs> = gql`
    ${CRATER_ERROR_FIELDS}
    ${SUBSCRIPTION_CANCELLATION_FIELDS}
    mutation SubscriptionsCancel($input: SubscriptionsCancelInput!) {
        subscriptionsCancel(input: $input) {
            subscription {
                ...SubscriptionCancellationFields
            }
            errors {
                ...CraterErrorFields
            }
        }
    }
`

export const POST = withCraterSession({ log: "Crater subscription cancellation error", error: "Could not cancel the Crater subscription.", rateLimit: "subscription" }, async (request, token) => {
    const input = await readSubscriptionRequest(request)
    if (input.response) return input.response
    const { id, body } = input.data
    const immediately = body?.immediately === true

    return runCraterResourceMutation(token, SUBSCRIPTIONS_CANCEL, { input: { id, ...(immediately ? { immediately } : {}) } }, (data) => data.subscriptionsCancel, {
        rejectionMessage: "Crater could not cancel the subscription.",
        selectResource: (payload) => payload.subscription,
        missingResourceMessage: "Crater returned no cancelled subscription.",
    })
})
