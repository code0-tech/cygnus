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

const COMPLETION_STATES = new Set<string>(["CHECKOUT_PENDING", "PAYMENT_PENDING", "FULFILLMENT_PENDING", "READY", "FAILED"])
const PAYMENT_PERIODS = new Set<string>(["MONTHLY", "QUARTERLY", "YEARLY"])

function validConfiguration(configuration: NonNullable<CheckoutCompletionStatusData["checkoutCompletionStatus"]>["configuration"]) {
    if (!configuration || typeof configuration.customerType !== "string" || typeof configuration.deploymentType !== "string") return false
    if (configuration.paymentPeriod !== null && configuration.paymentPeriod !== undefined && !PAYMENT_PERIODS.has(configuration.paymentPeriod)) return false
    if (configuration.plan !== null && configuration.plan !== undefined && typeof configuration.plan !== "string") return false
    if (configuration.aiTokens !== null && configuration.aiTokens !== undefined && (!Number.isInteger(configuration.aiTokens) || configuration.aiTokens < 1)) return false
    if (configuration.workflowExecutions !== null && configuration.workflowExecutions !== undefined && (!Number.isInteger(configuration.workflowExecutions) || configuration.workflowExecutions < 1)) return false
    return true
}

function validPricing(pricing: NonNullable<CheckoutCompletionStatusData["checkoutCompletionStatus"]>["pricing"]) {
    if (!pricing || typeof pricing.currency !== "string" || !pricing.currency.trim()) return false
    return [pricing.discount, pricing.subtotal, pricing.tax, pricing.total].every((amount) => Number.isInteger(amount) && Number(amount) >= 0)
}

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

        if (
            !state ||
            !COMPLETION_STATES.has(state) ||
            !status.customerId ||
            (state === "READY" ? !status.licenseId : Boolean(status.licenseId)) ||
            (status.configuration ? !validConfiguration(status.configuration) : false) ||
            (status.pricing ? !validPricing(status.pricing) : false)
        ) {
            console.error("Crater returned an invalid checkout completion status.")
            return craterJson({ error: "Could not check the checkout completion status." }, 502)
        }

        return craterJson({
            state,
            customerId: status.customerId,
            licenseId: status.licenseId ?? null,
            configuration: status.configuration ?? null,
            pricing: status.pricing ?? null,
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
