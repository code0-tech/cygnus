import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterTransportErrorResponse, requireCraterSession } from "@/lib/checkout/craterApi"
import { parseCheckoutSessionId } from "@/lib/checkout/checkoutReturn"
import type { Query, QueryCheckoutCompletionStatusArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"
import { CombinedGraphQLErrors } from "@apollo/client/errors"

export const runtime = "nodejs"

type CheckoutCompletionStatusData = Pick<Query, "checkoutCompletionStatus">

const CHECKOUT_COMPLETION_STATUS: TypedDocumentNode<CheckoutCompletionStatusData, QueryCheckoutCompletionStatusArgs> = gql`
    query CheckoutCompletionStatus($sessionId: String!) {
        checkoutCompletionStatus(sessionId: $sessionId) {
            state
            customerId
            licenseId
        }
    }
`

const COMPLETION_STATES = new Set<string>(["CHECKOUT_PENDING", "PAYMENT_PENDING", "FULFILLMENT_PENDING", "READY", "FAILED"])

function graphQLErrorCode(error: unknown) {
    if (!CombinedGraphQLErrors.is(error)) return undefined

    const errorCode = error.errors.find((graphQLError) => typeof graphQLError.extensions?.errorCode === "string")?.extensions?.errorCode
    return typeof errorCode === "string" ? errorCode : undefined
}

export async function GET(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    const requestUrl = new URL(request.url)
    const sessionId = parseCheckoutSessionId(requestUrl.searchParams.get("sessionId") ?? undefined)
    if (!sessionId) return craterJson({ error: "A valid checkout session is required." }, 400)

    try {
        const result = await createApolloClient(session.token).query({
            query: CHECKOUT_COMPLETION_STATUS,
            variables: { sessionId },
            fetchPolicy: "no-cache",
        })
        const status = result.data?.checkoutCompletionStatus
        const state = status?.state

        if (!state || !COMPLETION_STATES.has(state) || !status.customerId || (state === "READY" ? !status.licenseId : Boolean(status.licenseId))) {
            console.error("Crater returned an invalid checkout completion status.")
            return craterJson({ error: "Could not check the checkout completion status." }, 502)
        }

        return craterJson({
            state,
            customerId: status.customerId,
            licenseId: status.licenseId ?? null,
        })
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        const errorCode = graphQLErrorCode(error)
        if (errorCode === "INVALID_CHECKOUT_STATUS_SESSION") {
            return craterJson({ error: "The checkout session could not be verified.", errorCode }, 404)
        }
        if (errorCode === "CHECKOUT_STATUS_UNAVAILABLE") {
            return craterJson({ error: "The checkout status is temporarily unavailable.", errorCode }, 503)
        }

        console.error("Crater checkout completion status error:", error instanceof Error ? error.name : "Unknown error")
        return craterJson({ error: "Could not check the checkout completion status." }, 502)
    }
}
