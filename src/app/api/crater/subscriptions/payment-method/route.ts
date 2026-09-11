import { createApolloClient } from "@/lib/apolloClient"
import { CRATER_ERROR_FIELDS, craterJson, craterMutationErrorResponse, craterTransportErrorResponse, optionalString, readJsonObject, requireCraterSession } from "@/lib/checkout/craterApi"
import { isSubscriptionId } from "@/lib/licenses/craterSubscriptionRequest"
import type { Mutation, MutationSubscriptionsUpdateArgs, Query, QuerySubscriptionPaymentMethodArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type SubscriptionPaymentMethodData = Pick<Query, "subscriptionPaymentMethod">

type SubscriptionsSetPaymentMethodData = Pick<Mutation, "subscriptionsUpdate">
type SubscriptionsSetPaymentMethodVariables = MutationSubscriptionsUpdateArgs

const SUBSCRIPTION_PAYMENT_METHOD: TypedDocumentNode<SubscriptionPaymentMethodData, QuerySubscriptionPaymentMethodArgs> = gql`
    query SubscriptionPaymentMethod($subscriptionId: SubscriptionID!) {
        subscriptionPaymentMethod(subscriptionId: $subscriptionId) {
            brand
            expiresMonth
            expiresYear
            last4
            type
        }
    }
`

// Crater retired subscriptionsSetPaymentMethod; the payment method is now one more field of
// subscriptionsUpdate. Sent on its own it skips the plan half entirely and applies immediately.
const SUBSCRIPTIONS_SET_PAYMENT_METHOD: TypedDocumentNode<SubscriptionsSetPaymentMethodData, SubscriptionsSetPaymentMethodVariables> = gql`
    ${CRATER_ERROR_FIELDS}
    mutation SubscriptionsSetPaymentMethod($input: SubscriptionsUpdateInput!) {
        subscriptionsUpdate(input: $input) {
            subscription {
                id
                paymentMethodId
            }
            errors {
                ...CraterErrorFields
            }
        }
    }
`

export async function GET(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    const subscriptionId = new URL(request.url).searchParams.get("subscriptionId")?.trim() ?? ""
    if (!isSubscriptionId(subscriptionId)) return craterJson({ error: "A valid Crater subscription id is required." }, 400)

    try {
        const result = await createApolloClient(session.token).query({
            query: SUBSCRIPTION_PAYMENT_METHOD,
            variables: { subscriptionId },
            fetchPolicy: "no-cache",
        })

        return craterJson({ paymentMethod: result.data?.subscriptionPaymentMethod ?? null })
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater subscription payment method summary error:", error instanceof Error ? error.name : "UnknownError")
        return craterJson({ error: "Could not load the subscription payment method." }, 502)
    }
}

export async function PATCH(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    const body = await readJsonObject(request)
    const subscriptionId = optionalString(body?.subscriptionId)
    const paymentMethodId = optionalString(body?.paymentMethodId)

    if (!subscriptionId || !isSubscriptionId(subscriptionId) || !paymentMethodId) {
        return craterJson({ error: "A valid Crater subscription id and payment method id are required." }, 400)
    }

    try {
        const result = await createApolloClient(session.token).mutate({
            mutation: SUBSCRIPTIONS_SET_PAYMENT_METHOD,
            variables: { input: { id: subscriptionId, paymentMethodId } },
        })
        const payload = result.data?.subscriptionsUpdate

        if (!payload) throw new Error("Crater returned no subscription payment method payload.")

        const errorResponse = craterMutationErrorResponse(payload.errors, "Crater could not update the subscription's payment method.")
        if (errorResponse) return errorResponse

        return craterJson({ paymentMethodId: payload.subscription?.paymentMethodId ?? null })
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater subscription set payment method error:", error instanceof Error ? error.name : "UnknownError")
        return craterJson({ error: "Could not update the subscription's payment method." }, 502)
    }
}
