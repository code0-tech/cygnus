import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterTransportErrorResponse, requireCraterSession } from "@/lib/checkout/craterApi"
import type { CustomerPaymentMethodSummary } from "@/lib/licenses/customerPaymentMethods"
import type { Query, QueryCustomerPaymentMethodArgs, Scalars, SubscriptionPaymentMethodSummary } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type CustomerPaymentMethodsData = Pick<Query, "currentUser">
type CustomerPaymentMethodsVariables = { after?: string }

// customerPaymentMethod takes a Stripe PaymentMethod id, a plain String in Crater's schema rather than a
// global id, and answers with the same summary type as subscriptionPaymentMethod.
type CustomerPaymentMethodData = Pick<Query, "customerPaymentMethod">

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

const CUSTOMER_PAYMENT_METHOD: TypedDocumentNode<CustomerPaymentMethodData, QueryCustomerPaymentMethodArgs> = gql`
    query CustomerPaymentMethod($paymentMethodId: String!) {
        customerPaymentMethod(paymentMethodId: $paymentMethodId) {
            brand
            expiresMonth
            expiresYear
            last4
            type
        }
    }
`

function paymentMethodSummary(id: string, method: SubscriptionPaymentMethodSummary | null | undefined): CustomerPaymentMethodSummary {
    return {
        id,
        brand: method?.brand ?? null,
        expiresMonth: typeof method?.expiresMonth === "number" ? method.expiresMonth : null,
        expiresYear: typeof method?.expiresYear === "number" ? method.expiresYear : null,
        last4: method?.last4 ?? null,
        type: method?.type ?? null,
    }
}

// Customer.paymentMethods carries nothing but the ids; brand, last four digits, and expiry come from
// customerPaymentMethod, one request per id. A method Crater cannot describe right now keeps its place in
// the list with empty details, because the client sends the list back to customersUpdate and a dropped id
// would detach the payment method in Stripe.
async function resolvePaymentMethods(client: ReturnType<typeof createApolloClient>, paymentMethodIds: string[]) {
    return Promise.all(
        paymentMethodIds.map(async (paymentMethodId) => {
            try {
                const result = await client.query({
                    query: CUSTOMER_PAYMENT_METHOD,
                    variables: { paymentMethodId },
                    fetchPolicy: "no-cache",
                })

                return paymentMethodSummary(paymentMethodId, result.data?.customerPaymentMethod)
            } catch (error) {
                console.error("Crater customer payment method summary error:", error instanceof Error ? error.name : "UnknownError")
                return paymentMethodSummary(paymentMethodId, null)
            }
        })
    )
}

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
            if (!user.customers?.nodes || !user.customers.pageInfo) throw new Error("Crater returned an incomplete customer connection.")
            const customer = user.customers.nodes.find((candidate) => candidate?.id === customerId)
            if (customer) {
                if (!Array.isArray(customer.paymentMethods) || !customer.paymentMethods.every((id) => typeof id === "string" && id.length > 0)) {
                    throw new Error("Crater returned an invalid payment method list.")
                }
                return craterJson({ paymentMethods: await resolvePaymentMethods(client, customer.paymentMethods) })
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
