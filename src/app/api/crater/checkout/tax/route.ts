import { createApolloClient } from "@/lib/apolloClient"
import {
    CRATER_ERROR_FIELDS,
    craterJson,
    craterMutationErrorResponse,
    craterTransportErrorResponse,
    optionalString,
    readJsonObject,
    requireCraterSession,
    type JsonObject,
} from "@/lib/checkout/craterApi"
import { toCraterPaymentPeriod } from "@/lib/checkout/craterCheckout"
import { resolveSubscriptionSelection } from "@/lib/subscriptionConfigurator"
import { enforceRateLimit } from "@/lib/security/rateLimiter"
import type { Mutation, MutationCheckoutCalculateTaxArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type CheckoutCalculateTaxData = Pick<Mutation, "checkoutCalculateTax">

const CHECKOUT_CALCULATE_TAX: TypedDocumentNode<CheckoutCalculateTaxData, MutationCheckoutCalculateTaxArgs> = gql`
    ${CRATER_ERROR_FIELDS}
    mutation CheckoutCalculateTax($input: CheckoutCalculateTaxInput!) {
        checkoutCalculateTax(input: $input) {
            taxQuote {
                amountTotal
                currency
                taxAmountExclusive
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

    const rateLimitResponse = enforceRateLimit("tax", request)
    if (rateLimitResponse) return rateLimitResponse

    const body = await readJsonObject(request)
    const requestData = body?.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata) ? (body.metadata as JsonObject) : body
    const plan = optionalString(requestData?.plan)

    if (!body || !plan) {
        return craterJson({ error: "plan is required." }, 400)
    }

    try {
        const { getSubscriptionConfig } = await import("@/lib/cms")
        const subscriptionConfig = await getSubscriptionConfig()
        if (!subscriptionConfig) return craterJson({ error: "Subscription configuration is unavailable." }, 503)

        const resolvedSelection = resolveSubscriptionSelection(
            {
                plan,
                customerType: optionalString(requestData?.customerType),
                paymentPeriod: optionalString(requestData?.paymentPeriod),
                workflowExecutions: optionalString(requestData?.workflowExecutions),
                aiTokens: optionalString(requestData?.aiTokens),
            },
            subscriptionConfig
        )

        if (resolvedSelection.issues.length) {
            return craterJson(
                {
                    error: "The checkout configuration is invalid.",
                    details: resolvedSelection.issues.map((issue) => issue.message),
                },
                400
            )
        }

        const { selection } = resolvedSelection
        const input: MutationCheckoutCalculateTaxArgs["input"] = {
            plan: selection.plan,
            paymentPeriod: toCraterPaymentPeriod(selection.paymentPeriod),
            ...(selection.plan === "custom"
                ? {
                      aiTokens: selection.aiTokens,
                      workflowExecutions: selection.workflowExecutions,
                  }
                : {}),
        }
        const result = await createApolloClient(session.token).mutate({
            mutation: CHECKOUT_CALCULATE_TAX,
            variables: { input },
        })
        const payload = result.data?.checkoutCalculateTax

        if (!payload) throw new Error("Crater returned no tax payload.")

        const errorResponse = craterMutationErrorResponse(payload.errors, "Crater could not calculate tax.")
        if (errorResponse) return errorResponse
        if (!payload.taxQuote) throw new Error("Crater returned no tax quote.")

        return craterJson(payload.taxQuote)
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater tax calculation error:", error)
        return craterJson({ error: "Could not calculate checkout tax." }, 502)
    }
}
