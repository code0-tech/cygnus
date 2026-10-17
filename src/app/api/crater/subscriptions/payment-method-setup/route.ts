import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterMutationErrorResponse, craterTransportErrorResponse, optionalString, readJsonObject, requireCraterSession } from "@/lib/checkout/craterApi"
import type { Mutation, MutationSubscriptionPaymentMethodSetupCreateArgs, Query, QuerySubscriptionPaymentMethodSetupStatusArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type SubscriptionPaymentMethodSetupCreateData = Pick<Mutation, "subscriptionPaymentMethodSetupCreate">
type SubscriptionPaymentMethodSetupStatusData = Pick<Query, "subscriptionPaymentMethodSetupStatus">

function isSubscriptionId(value: string): value is MutationSubscriptionPaymentMethodSetupCreateArgs["input"]["subscriptionId"] {
    return /^gid:\/\/crater\/Subscription\/\d+$/.test(value)
}

const SUBSCRIPTION_PAYMENT_METHOD_SETUP_CREATE: TypedDocumentNode<SubscriptionPaymentMethodSetupCreateData, MutationSubscriptionPaymentMethodSetupCreateArgs> = gql`
    mutation SubscriptionPaymentMethodSetupCreate($input: SubscriptionPaymentMethodSetupCreateInput!) {
        subscriptionPaymentMethodSetupCreate(input: $input) {
            session {
                clientSecret
            }
            errors {
                errorCode
                details {
                    __typename
                    ... on ActiveModelError {
                        attribute
                        type
                    }
                    ... on MessageError {
                        message
                    }
                }
            }
        }
    }
`

const SUBSCRIPTION_PAYMENT_METHOD_SETUP_STATUS: TypedDocumentNode<SubscriptionPaymentMethodSetupStatusData, QuerySubscriptionPaymentMethodSetupStatusArgs> = gql`
    query SubscriptionPaymentMethodSetupStatus($subscriptionId: SubscriptionID!, $setupIntentId: String!) {
        subscriptionPaymentMethodSetupStatus(subscriptionId: $subscriptionId, setupIntentId: $setupIntentId)
    }
`

export async function GET(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    const requestUrl = new URL(request.url)
    const subscriptionId = requestUrl.searchParams.get("subscriptionId")?.trim() ?? ""
    const setupIntentId = requestUrl.searchParams.get("setupIntentId")?.trim() ?? ""
    if (!isSubscriptionId(subscriptionId) || !/^seti_[A-Za-z0-9]+$/.test(setupIntentId)) {
        return craterJson({ error: "A valid Crater subscription id and SetupIntent id are required." }, 400)
    }

    try {
        const result = await createApolloClient(session.token).query({
            query: SUBSCRIPTION_PAYMENT_METHOD_SETUP_STATUS,
            variables: { setupIntentId, subscriptionId },
            fetchPolicy: "no-cache",
        })
        const status = result.data?.subscriptionPaymentMethodSetupStatus
        if (!status) throw new Error("Crater returned no subscription payment method setup status.")
        return craterJson({ status: status.toLowerCase() })
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater subscription payment method setup status error:", error instanceof Error ? error.name : "UnknownError")
        return craterJson({ error: "Could not check the subscription payment method setup status." }, 502)
    }
}

export async function POST(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    const body = await readJsonObject(request)
    const subscriptionId = optionalString(body?.subscriptionId)
    if (!subscriptionId || !isSubscriptionId(subscriptionId)) return craterJson({ error: "A valid Crater subscription id is required." }, 400)

    try {
        const result = await createApolloClient(session.token).mutate({
            mutation: SUBSCRIPTION_PAYMENT_METHOD_SETUP_CREATE,
            variables: { input: { subscriptionId } },
        })
        const payload = result.data?.subscriptionPaymentMethodSetupCreate
        if (!payload) throw new Error("Crater returned no subscription payment method setup payload.")

        const errorResponse = craterMutationErrorResponse(payload.errors, "Crater could not create the subscription payment method setup session.")
        if (errorResponse) return errorResponse

        const clientSecret = payload.session?.clientSecret
        if (!clientSecret) throw new Error("Crater returned no SetupIntent client secret.")
        return craterJson({ clientSecret }, 201)
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater subscription payment method setup error:", error instanceof Error ? error.name : "UnknownError")
        return craterJson({ error: "Could not create the subscription payment method setup session." }, 502)
    }
}
