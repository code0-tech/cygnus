import { SUBSCRIPTION_CANCELLATION_FIELDS } from "@/lib/crater/subscriptionFragments"
import { CRATER_ERROR_FIELDS, craterJson, runCraterResourceMutation, withCraterSession } from "@/lib/crater/api.server"
import { readSubscriptionRequest } from "@/lib/crater/subscriptionRequests.server"
import { EXTRAORDINARY_TERMINATION_REASONS, isExtraordinaryTerminationReason } from "@/lib/subscription/terminationReasons"
import type { Mutation, MutationSubscriptionsExtraordinaryTerminationArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type SubscriptionsExtraordinaryTerminationData = Pick<Mutation, "subscriptionsExtraordinaryTermination">

const SUBSCRIPTIONS_EXTRAORDINARY_TERMINATION: TypedDocumentNode<SubscriptionsExtraordinaryTerminationData, MutationSubscriptionsExtraordinaryTerminationArgs> = gql`
    ${CRATER_ERROR_FIELDS}
    ${SUBSCRIPTION_CANCELLATION_FIELDS}
    mutation SubscriptionsExtraordinaryTermination($input: SubscriptionsExtraordinaryTerminationInput!) {
        subscriptionsExtraordinaryTermination(input: $input) {
            subscription {
                ...SubscriptionCancellationFields
            }
            errors {
                ...CraterErrorFields
            }
        }
    }
`

// Crater only records the request in the Stripe metadata and mails a receipt; a human decides within three business
// days whether the subscription ends immediately or at the end of the period, so nothing is cancelled here.
export const POST = withCraterSession(
    { log: "Crater extraordinary termination error", error: "Could not request the extraordinary termination.", rateLimit: "subscription" },
    async (request, token) => {
        const input = await readSubscriptionRequest(request)
        if (input.response) return input.response
        const { id, body } = input.data
        const reason = body.reason
        if (!isExtraordinaryTerminationReason(reason)) {
            return craterJson({ error: `reason must be one of ${EXTRAORDINARY_TERMINATION_REASONS.join(", ")}.` }, 400)
        }

        return runCraterResourceMutation(token, SUBSCRIPTIONS_EXTRAORDINARY_TERMINATION, { input: { id, reason } }, (data) => data.subscriptionsExtraordinaryTermination, {
            rejectionMessage: "Crater could not record the extraordinary termination.",
            selectResource: (payload) => payload.subscription,
            missingResourceMessage: "Crater returned no subscription for the extraordinary termination.",
        })
    }
)
