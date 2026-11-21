import { createApolloClient } from "@/lib/apolloClient"
import { craterJson } from "@/lib/crater/api.server"
import type { CustomersUpdateInput, Query } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

const CUSTOMER_PAYMENT_METHODS: TypedDocumentNode<Pick<Query, "currentUser">, Record<string, never>> = gql`
    query CustomerPaymentMethods {
        currentUser {
            customer {
                id
                paymentMethods
            }
        }
    }
`

const unauthenticated = () => ({ response: craterJson({ error: "The Crater session has no authenticated user." }, 401) })

export async function readCustomerPaymentMethodIds(
    client: ReturnType<typeof createApolloClient>,
    customerId: string
): Promise<{ paymentMethodIds: string[]; response?: never } | { paymentMethodIds?: never; response: Response }> {
    const result = await client.query({ query: CUSTOMER_PAYMENT_METHODS, fetchPolicy: "no-cache" })
    const user = result.data?.currentUser
    if (!user) return unauthenticated()
    const customer = user.customer
    if (customer?.id !== customerId) return { response: craterJson({ error: "The customer was not found." }, 404) }
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
