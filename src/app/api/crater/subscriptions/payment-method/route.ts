import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterTransportErrorResponse, requireCraterSession } from "@/lib/checkout/craterApi"
import type { Query, QuerySubscriptionPaymentMethodArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type SubscriptionPaymentMethodData = Pick<Query, "subscriptionPaymentMethod">

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

function isSubscriptionId(value: string): value is QuerySubscriptionPaymentMethodArgs["subscriptionId"] {
    return /^gid:\/\/crater\/Subscription\/\d+$/.test(value)
}

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
