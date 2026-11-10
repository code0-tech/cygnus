import { createApolloClient } from "@/lib/apolloClient"
import { craterJson } from "@/lib/crater/api.server"
import { locateCustomer } from "@/lib/licenses/snapshotLookup.server"
import type { CustomersUpdateInput, Query } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

// paymentMethods reads Stripe on every request, so it is only ever selected for the one customer asked for: the
// customer is located through its id first, and a Stripe failure of another customer cannot break this one.
const CUSTOMER_PAYMENT_METHODS: TypedDocumentNode<Pick<Query, "currentUser">, { customerAfter?: string }> = gql`
    query CustomerPaymentMethods($customerAfter: String) {
        currentUser {
            customers(first: 1, after: $customerAfter) {
                nodes {
                    id
                    paymentMethods
                }
            }
        }
    }
`

const unauthenticated = () => ({ response: craterJson({ error: "The Crater session has no authenticated user." }, 401) })

export async function readCustomerPaymentMethodIds(
    client: ReturnType<typeof createApolloClient>,
    customerId: string
): Promise<{ paymentMethodIds: string[]; response?: never } | { paymentMethodIds?: never; response: Response }> {
    const located = await locateCustomer(client, customerId)
    if (located.status === "unauthenticated") return unauthenticated()
    if (located.status === "missing") return { response: craterJson({ error: "The customer was not found." }, 404) }

    const result = await client.query({
        query: CUSTOMER_PAYMENT_METHODS,
        variables: { ...(located.customerAfter ? { customerAfter: located.customerAfter } : {}) },
        fetchPolicy: "no-cache",
    })
    const user = result.data?.currentUser
    if (!user) return unauthenticated()
    const customer = user.customers?.nodes?.[0]
    if (customer?.id !== customerId) throw new Error("Crater returned a different customer while reading payment methods.")
    if (!Array.isArray(customer.paymentMethods) || !customer.paymentMethods.every((id) => typeof id === "string" && id.trim().length > 0)) {
        throw new Error("Crater returned an invalid payment method list.")
    }
    return { paymentMethodIds: customer.paymentMethods }
}

export async function prepareCustomerPaymentMethodRemoval(
    token: string,
    customerId: string,
    target: string
): Promise<{ input: Pick<CustomersUpdateInput, "paymentMethods">; response?: never } | { input?: never; response: Response }> {
    const current = await readCustomerPaymentMethodIds(createApolloClient(token), customerId)
    if (current.response) return { response: current.response }
    return { input: current.paymentMethodIds.includes(target) ? { paymentMethods: current.paymentMethodIds.filter((methodId) => methodId !== target) } : {} }
}
