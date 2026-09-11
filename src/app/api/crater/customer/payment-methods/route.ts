import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterTransportErrorResponse, requireCraterSession } from "@/lib/checkout/craterApi"
import type { Scalars } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type CustomerPaymentMethodsData = {
    currentUser: {
        customers: {
            nodes: Array<{ id: string; paymentMethods: string[] } | null>
            pageInfo: { endCursor: string | null; hasNextPage: boolean }
        }
    } | null
}
type CustomerPaymentMethodsVariables = { after?: string }

function isCustomerId(value: string): value is Scalars["CustomerID"]["input"] {
    return /^gid:\/\/crater\/Customer\/\d+$/.test(value)
}

const CUSTOMER_PAYMENT_METHODS: TypedDocumentNode<CustomerPaymentMethodsData, CustomerPaymentMethodsVariables> = gql`
    query CustomerPaymentMethods($after: String) {
        currentUser {
            customers(first: 50, after: $after) {
                nodes { id paymentMethods }
                pageInfo { endCursor hasNextPage }
            }
        }
    }
`

export async function GET(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    const customerId = new URL(request.url).searchParams.get("customerId")?.trim() ?? ""
    if (!isCustomerId(customerId)) return craterJson({ error: "A valid Crater customer id is required." }, 400)

    try {
        const client = createApolloClient(session.token)
        let after: string | undefined
        const cursors = new Set<string>()
        do {
            const result = await client.query({
                query: CUSTOMER_PAYMENT_METHODS,
                variables: { ...(after ? { after } : {}) },
                fetchPolicy: "no-cache",
            })
            const user = result.data?.currentUser
            if (!user) return craterJson({ error: "The Crater session has no authenticated user." }, 401)
            const customer = user.customers.nodes.find((candidate) => candidate?.id === customerId)
            if (customer) {
                if (!Array.isArray(customer.paymentMethods) || !customer.paymentMethods.every((id) => typeof id === "string" && id.length > 0)) {
                    throw new Error("Crater returned an invalid payment method list.")
                }
                return craterJson({ paymentMethods: customer.paymentMethods })
            }
            const pageInfo = user.customers.pageInfo
            if (!pageInfo.hasNextPage) break
            if (!pageInfo.endCursor || cursors.has(pageInfo.endCursor)) throw new Error("Crater returned an invalid customer cursor.")
            after = pageInfo.endCursor
            cursors.add(after)
        } while (after)
        return craterJson({ error: "The customer was not found." }, 404)
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater customer payment methods error:", error instanceof Error ? error.name : "UnknownError")
        return craterJson({ error: "Could not load the customer's payment methods." }, 502)
    }
}
