import { createApolloClient } from "@/lib/apolloClient"
import { CRATER_ERROR_FIELDS, craterJson, craterMutationErrorResponse, craterTransportErrorResponse, optionalString, readJsonObject, requireCraterSession } from "@/lib/checkout/craterApi"
import { isSubscriptionId } from "@/lib/licenses/craterRequest"
import type { Mutation, MutationSubscriptionsUpdateArgs, Query, QueryPaymentMethodArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type SubscriptionPaymentMethodData = Pick<Query, "currentUser">
type SubscriptionPaymentMethodVariables = { customerAfter?: string; subscriptionAfter?: string }

type SubscriptionsSetPaymentMethodData = Pick<Mutation, "subscriptionsUpdate">
type SubscriptionsSetPaymentMethodVariables = MutationSubscriptionsUpdateArgs

const SUBSCRIPTION_PAYMENT_METHOD: TypedDocumentNode<SubscriptionPaymentMethodData, SubscriptionPaymentMethodVariables> = gql`
    query SubscriptionPaymentMethod($customerAfter: String, $subscriptionAfter: String) {
        currentUser {
            customers(first: 1, after: $customerAfter) {
                nodes {
                    id
                    subscriptions(first: 50, after: $subscriptionAfter) {
                        nodes { id paymentMethodId }
                        pageInfo { endCursor hasNextPage }
                    }
                }
                pageInfo { endCursor hasNextPage }
            }
        }
    }
`

const PAYMENT_METHOD: TypedDocumentNode<Pick<Query, "paymentMethod">, QueryPaymentMethodArgs> = gql`
    query SubscriptionPaymentMethodSummary($paymentMethodId: String!) {
        paymentMethod(paymentMethodId: $paymentMethodId) {
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
        const client = createApolloClient(session.token)
        let customerAfter: string | undefined
        let subscriptionAfter: string | undefined
        let customerId: string | undefined
        const customerCursors = new Set<string>()
        const subscriptionCursors = new Set<string>()
        while (true) {
            const result = await client.query({
                query: SUBSCRIPTION_PAYMENT_METHOD,
                variables: { ...(customerAfter ? { customerAfter } : {}), ...(subscriptionAfter ? { subscriptionAfter } : {}) },
                fetchPolicy: "no-cache",
            })
            const user = result.data?.currentUser
            if (!user) return craterJson({ error: "The Crater session has no authenticated user." }, 401)
            const customers = user.customers
            if (!customers?.nodes || !customers.pageInfo) throw new Error("Crater returned an incomplete customer connection.")
            const customer = customers.nodes[0]
            if (!customer) break
            if (!customer.id) throw new Error("Crater returned a customer without an id.")
            if (customerId && customer.id !== customerId) throw new Error("Crater returned a different customer while paginating subscriptions.")
            customerId = customer.id
            const subscriptions = customer.subscriptions
            if (!subscriptions?.nodes || !subscriptions.pageInfo) throw new Error("Crater returned an incomplete subscription connection.")
            const subscription = subscriptions.nodes.find((candidate) => candidate?.id === subscriptionId)
            if (subscription) {
                if (!subscription.paymentMethodId) return craterJson({ paymentMethod: null })
                const summary = await client.query({
                    query: PAYMENT_METHOD,
                    variables: { paymentMethodId: subscription.paymentMethodId },
                    fetchPolicy: "no-cache",
                })
                return craterJson({ paymentMethod: summary.data?.paymentMethod ?? null })
            }
            if (subscriptions.pageInfo.hasNextPage) {
                const cursor = subscriptions.pageInfo.endCursor
                if (!cursor || subscriptionCursors.has(cursor)) throw new Error("Crater returned an invalid subscription cursor.")
                subscriptionCursors.add(cursor)
                subscriptionAfter = cursor
                continue
            }
            if (!customers.pageInfo.hasNextPage) break
            const cursor = customers.pageInfo.endCursor
            if (!cursor || customerCursors.has(cursor)) throw new Error("Crater returned an invalid customer cursor.")
            customerCursors.add(cursor)
            customerAfter = cursor
            customerId = undefined
            subscriptionAfter = undefined
            subscriptionCursors.clear()
        }
        return craterJson({ error: "The subscription was not found." }, 404)
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
