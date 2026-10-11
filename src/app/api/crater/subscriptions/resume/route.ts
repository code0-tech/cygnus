import { CRATER_ERROR_FIELDS, craterJson, runCraterMutation, withCraterSession } from "@/lib/crater/api.server"
import { optionalString, readJsonObject, isSubscriptionId } from "@/lib/crater/request"
import type { Mutation, MutationSubscriptionsResumeArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type SubscriptionsResumeData = Pick<Mutation, "subscriptionsResume">

const SUBSCRIPTIONS_RESUME: TypedDocumentNode<SubscriptionsResumeData, MutationSubscriptionsResumeArgs> = gql`
    ${CRATER_ERROR_FIELDS}
    mutation SubscriptionsResume($input: SubscriptionsResumeInput!) {
        subscriptionsResume(input: $input) {
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

export const POST = withCraterSession({ log: "Crater subscription resume error", error: "Could not resume the Crater subscription." }, async (request, token) => {
    const body = await readJsonObject(request)
    const id = optionalString(body?.id)
    if (!id || !isSubscriptionId(id)) {
        return craterJson({ error: "A valid Crater subscription id is required." }, 400)
    }

    const mutation = await runCraterMutation(token, SUBSCRIPTIONS_RESUME, { input: { id } }, (data) => data.subscriptionsResume, "Crater could not resume the subscription.")
    if (mutation.response) return mutation.response
    if (!mutation.payload.subscription) throw new Error("Crater returned no resumed subscription.")

    return craterJson(mutation.payload.subscription)
})
