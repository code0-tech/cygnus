import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterMutationErrorResponse, craterTransportErrorResponse, optionalString, readJsonObject, requireCraterSession } from "@/lib/checkout/craterApi"
import type { Mutation, MutationCustomerPaymentMethodSetupCreateArgs, Scalars } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type CustomerPaymentMethodSetupCreateData = Pick<Mutation, "customerPaymentMethodSetupCreate">

function isCustomerId(value: string): value is Scalars["CustomerID"]["input"] {
    return /^gid:\/\/crater\/Customer\/\d+$/.test(value)
}

const CUSTOMER_PAYMENT_METHOD_SETUP_CREATE: TypedDocumentNode<CustomerPaymentMethodSetupCreateData, MutationCustomerPaymentMethodSetupCreateArgs> = gql`
    mutation CustomerPaymentMethodSetupCreate($input: CustomerPaymentMethodSetupCreateInput!) {
        customerPaymentMethodSetupCreate(input: $input) {
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

export async function POST(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    const body = await readJsonObject(request)
    const customerId = optionalString(body?.customerId)

    if (!customerId || !isCustomerId(customerId)) {
        return craterJson({ error: "A valid Crater customer id is required." }, 400)
    }

    try {
        const result = await createApolloClient(session.token).mutate({
            mutation: CUSTOMER_PAYMENT_METHOD_SETUP_CREATE,
            variables: { input: { customerId } },
        })
        const payload = result.data?.customerPaymentMethodSetupCreate

        if (!payload) throw new Error("Crater returned no payment method setup payload.")

        const errorResponse = craterMutationErrorResponse(payload.errors, "Crater could not create the payment method setup session.")
        if (errorResponse) return errorResponse

        const clientSecret = payload.session?.clientSecret
        if (!clientSecret) throw new Error("Crater returned no SetupIntent client secret.")

        return craterJson({ clientSecret }, 201)
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater payment method setup error:", error instanceof Error ? error.name : "UnknownError")
        return craterJson({ error: "Could not create the payment method setup session." }, 502)
    }
}
