import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterTransportErrorResponse, requireCraterSession } from "@/lib/checkout/craterApi"
import type { Query, QueryCustomerPaymentMethodsArgs, Scalars } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type CustomerPaymentMethodsData = Pick<Query, "customerPaymentMethods">

function isCustomerId(value: string): value is Scalars["CustomerID"]["input"] {
    return /^gid:\/\/crater\/Customer\/\d+$/.test(value)
}

const CUSTOMER_PAYMENT_METHODS: TypedDocumentNode<CustomerPaymentMethodsData, QueryCustomerPaymentMethodsArgs> = gql`
    query CustomerPaymentMethods($customerId: CustomerID!) {
        customerPaymentMethods(customerId: $customerId) {
            brand
            expiresMonth
            expiresYear
            id
            isDefault
            last4
            type
        }
    }
`

export async function GET(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    const customerId = new URL(request.url).searchParams.get("customerId")?.trim() ?? ""
    if (!isCustomerId(customerId)) return craterJson({ error: "A valid Crater customer id is required." }, 400)

    try {
        const result = await createApolloClient(session.token).query({
            query: CUSTOMER_PAYMENT_METHODS,
            variables: { customerId },
            fetchPolicy: "no-cache",
        })

        return craterJson({ paymentMethods: result.data?.customerPaymentMethods ?? [] })
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater customer payment methods error:", error instanceof Error ? error.name : "UnknownError")
        return craterJson({ error: "Could not load the customer's payment methods." }, 502)
    }
}
