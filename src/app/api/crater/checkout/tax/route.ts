import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterMutationErrorResponse, craterTransportErrorResponse, optionalString, readJsonObject, requireCraterSession } from "@/lib/checkout/craterApi"
import type { Mutation, MutationCheckoutCalculateTaxArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type CheckoutCalculateTaxData = Pick<Mutation, "checkoutCalculateTax">

const CHECKOUT_CALCULATE_TAX: TypedDocumentNode<CheckoutCalculateTaxData, MutationCheckoutCalculateTaxArgs> = gql`
    mutation CheckoutCalculateTax($input: CheckoutCalculateTaxInput!) {
        checkoutCalculateTax(input: $input) {
            taxQuote {
                amountTotal
                currency
                taxAmountExclusive
            }
            errors {
                errorCode
            }
        }
    }
`

export async function POST(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    const body = await readJsonObject(request)
    const plan = optionalString(body?.plan)

    if (!body || !plan) {
        return craterJson({ error: "plan is required." }, 400)
    }

    try {
        const result = await createApolloClient(session.token).mutate({
            mutation: CHECKOUT_CALCULATE_TAX,
            variables: { input: { plan } },
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
