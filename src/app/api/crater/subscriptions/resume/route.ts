import { SUBSCRIPTION_CANCELLATION_FIELDS } from "@/lib/crater/subscriptionFragments"
import { CRATER_ERROR_FIELDS, runCraterResourceMutation, withCraterSession } from "@/lib/crater/api.server"
import { readSubscriptionRequest } from "@/lib/crater/subscriptionRequests.server"
import type { Mutation, MutationSubscriptionsResumeArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type SubscriptionsResumeData = Pick<Mutation, "subscriptionsResume">

const SUBSCRIPTIONS_RESUME: TypedDocumentNode<SubscriptionsResumeData, MutationSubscriptionsResumeArgs> = gql`
    ${CRATER_ERROR_FIELDS}
    ${SUBSCRIPTION_CANCELLATION_FIELDS}
    mutation SubscriptionsResume($input: SubscriptionsResumeInput!) {
        subscriptionsResume(input: $input) {
            subscription {
                ...SubscriptionCancellationFields
            }
            errors {
                ...CraterErrorFields
            }
        }
    }
`

export const POST = withCraterSession({ log: "Crater subscription resume error", error: "Could not resume the Crater subscription.", rateLimit: "subscription" }, async (request, token) => {
    const input = await readSubscriptionRequest(request)
    if (input.response) return input.response
    const { id } = input.data

    return runCraterResourceMutation(token, SUBSCRIPTIONS_RESUME, { input: { id } }, (data) => data.subscriptionsResume, {
        rejectionMessage: "Crater could not resume the subscription.",
        selectResource: (payload) => payload.subscription,
        missingResourceMessage: "Crater returned no resumed subscription.",
    })
})
