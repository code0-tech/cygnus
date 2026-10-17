import { createApolloClient } from "@/lib/apolloClient"
import { CRATER_ERROR_FIELDS, craterJson, craterMutationErrorResponse, craterTransportErrorResponse, optionalString, readJsonObject, requireCraterSession } from "@/lib/checkout/craterApi"
import type { Mutation, MutationCustomerPaymentMethodDetachArgs, Scalars } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type CustomerPaymentMethodDetachData = Pick<Mutation, "customerPaymentMethodDetach">

function isCustomerId(value: string): value is Scalars["CustomerID"]["input"] {
    return /^gid:\/\/crater\/Customer\/\d+$/.test(value)
}

const CUSTOMER_PAYMENT_METHOD_DETACH: TypedDocumentNode<CustomerPaymentMethodDetachData, MutationCustomerPaymentMethodDetachArgs> = gql`
    ${CRATER_ERROR_FIELDS}
    mutation CustomerPaymentMethodDetach($input: CustomerPaymentMethodDetachInput!) {
        customerPaymentMethodDetach(input: $input) {
            paymentMethodId
            errors {
                ...CraterErrorFields
            }
        }
    }
`

export async function POST(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    const body = await readJsonObject(request)
    const customerId = optionalString(body?.customerId)
    const paymentMethodId = optionalString(body?.paymentMethodId)

    if (!customerId || !isCustomerId(customerId) || !paymentMethodId) {
        return craterJson({ error: "A valid Crater customer id and payment method id are required." }, 400)
    }

    try {
        const result = await createApolloClient(session.token).mutate({
            mutation: CUSTOMER_PAYMENT_METHOD_DETACH,
            variables: { input: { customerId, paymentMethodId } },
        })
        const payload = result.data?.customerPaymentMethodDetach

        if (!payload) throw new Error("Crater returned no payment method detach payload.")

        const errorResponse = craterMutationErrorResponse(payload.errors, "Crater could not remove the payment method.")
        if (errorResponse) return errorResponse
        if (!payload.paymentMethodId) throw new Error("Crater returned no detached payment method id.")

        return craterJson({ paymentMethodId: payload.paymentMethodId })
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater customer payment method detach error:", error instanceof Error ? error.name : "UnknownError")
        return craterJson({ error: "Could not remove the payment method." }, 502)
    }
}
