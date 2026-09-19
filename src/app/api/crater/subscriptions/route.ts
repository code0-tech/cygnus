import { createApolloClient } from "@/lib/apolloClient"
import { CRATER_ERROR_FIELDS, craterJson, craterMutationErrorResponse, craterTransportErrorResponse, optionalString, readJsonObject, requireCraterSession } from "@/lib/checkout/craterApi"
import { normalizeCraterPaymentPeriod, normalizeCraterPlan } from "@/lib/checkout/craterCheckout"
import { isSubscriptionId, parseSubscriptionChangeFields } from "@/lib/licenses/craterRequest"
import type { Mutation, MutationSubscriptionsUpdateArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type SubscriptionsUpdateData = Pick<Mutation, "subscriptionsUpdate">

const SUBSCRIPTIONS_UPDATE: TypedDocumentNode<SubscriptionsUpdateData, MutationSubscriptionsUpdateArgs> = gql`
    ${CRATER_ERROR_FIELDS}
    mutation SubscriptionsUpdate($input: SubscriptionsUpdateInput!) {
        subscriptionsUpdate(input: $input) {
            subscription {
                aiTokens
                canceledAt
                currentPeriodEnd
                expireAt
                id
                paymentPeriod
                plan
                status
                updatedAt
                workflowExecutions
            }
            errors {
                ...CraterErrorFields
            }
        }
    }
`

// The dashboard updates its licenses straight from this payload, so the CheckoutPlan and
// CheckoutPaymentPeriod enums are normalized here just like in the license dashboard route.
function normalizeSubscriptionEnums(subscription: NonNullable<NonNullable<SubscriptionsUpdateData["subscriptionsUpdate"]>["subscription"]>) {
    const plan = normalizeCraterPlan(subscription.plan)
    const paymentPeriod = normalizeCraterPaymentPeriod(subscription.paymentPeriod)

    return {
        ...subscription,
        plan: plan ?? null,
        paymentPeriod: paymentPeriod ?? null,
    }
}

export async function PATCH(request: Request) {
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
            mutation: SUBSCRIPTIONS_UPDATE,
            variables: { input: { id, ...fields } },
        })
        const payload = result.data?.subscriptionsUpdate
        if (!payload) throw new Error("Crater returned no subscription update payload.")

        const errorResponse = craterMutationErrorResponse(payload.errors, "Crater could not update the subscription.")
        if (errorResponse) return errorResponse
        if (!payload.subscription) throw new Error("Crater returned no updated subscription.")

        return craterJson(normalizeSubscriptionEnums(payload.subscription))
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater subscription update error:", error)
        return craterJson({ error: "Could not update the Crater subscription." }, 502)
    }
}
