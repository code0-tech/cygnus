import { createApolloClient } from "@/lib/apolloClient"
import { CRATER_ERROR_FIELDS, craterJson, craterMutationErrorResponse, craterTransportErrorResponse, requireCraterSession } from "@/lib/crater/api.server"
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

export async function POST(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    const body = await readJsonObject(request)
    const id = optionalString(body?.id)
    if (!id || !isSubscriptionId(id)) {
        return craterJson({ error: "A valid Crater subscription id is required." }, 400)
    }

    try {
        const result = await createApolloClient(session.token).mutate({
            mutation: SUBSCRIPTIONS_RESUME,
            variables: { input: { id } },
        })
        const payload = result.data?.subscriptionsResume
        if (!payload) throw new Error("Crater returned no subscription resume payload.")

        const errorResponse = craterMutationErrorResponse(payload.errors, "Crater could not resume the subscription.")
        if (errorResponse) return errorResponse
        if (!payload.subscription) throw new Error("Crater returned no resumed subscription.")

        return craterJson(payload.subscription)
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater subscription resume error:", error)
        return craterJson({ error: "Could not resume the Crater subscription." }, 502)
    }
}
