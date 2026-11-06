import { parseCheckoutCompletionStatus } from "@/lib/checkout/completionStatus"
import { completeGuestCheckoutSession } from "@/lib/checkout/guestCheckoutSession"
import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterTransportErrorResponse, requireCraterSession } from "@/lib/crater/api.server"
import { normalizeCraterDeploymentType, normalizeCraterPaymentPeriod, normalizeCraterPlan, parseCheckoutSessionId, normalizeCraterCustomerType } from "@/lib/crater/values"
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
            configuration {
                aiTokens
                customerType
                deploymentType
                paymentPeriod
                plan
                workflowExecutions
            }
            pricing {
                currency
                discount
                subtotal
                tax
                total
            }
        }
    }
`

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

        const rawConfiguration = status?.configuration
        const configuration = rawConfiguration
            ? {
                  aiTokens: rawConfiguration.aiTokens ?? null,
                  customerType: normalizeCraterCustomerType(rawConfiguration.customerType) ?? rawConfiguration.customerType,
                  deploymentType: normalizeCraterDeploymentType(rawConfiguration.deploymentType) ?? rawConfiguration.deploymentType,
                  paymentPeriod: rawConfiguration.paymentPeriod == null ? null : (normalizeCraterPaymentPeriod(rawConfiguration.paymentPeriod) ?? rawConfiguration.paymentPeriod),
                  plan: rawConfiguration.plan == null ? null : (normalizeCraterPlan(rawConfiguration.plan) ?? rawConfiguration.plan),
                  workflowExecutions: rawConfiguration.workflowExecutions ?? null,
              }
            : null
        const completion = parseCheckoutCompletionStatus(
            status && {
                state: status.state,
                customerId: status.customerId,
                licenseId: status.licenseId ?? null,
                configuration,
                pricing: status.pricing ?? null,
            }
        )

        if (!completion) {
            console.error("Crater returned an invalid checkout completion status.")
            return craterJson({ error: "Could not check the checkout completion status." }, 502)
        }

        const response = craterJson(completion)
        if (completion.state === "READY" && completion.licenseId) return completeGuestCheckoutSession(response, request, sessionId, completion.licenseId)
        return response
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error, request)
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
