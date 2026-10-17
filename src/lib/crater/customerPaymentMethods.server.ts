import { createApolloClient } from "@/lib/apolloClient"
import { craterJson } from "@/lib/crater/api.server"
import type { Query } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

const CUSTOMER_PAYMENT_METHODS: TypedDocumentNode<Pick<Query, "currentUser">, { after?: string }> = gql`
    query CustomerPaymentMethods($after: String) {
        currentUser {
            customers(first: 50, after: $after) {
                nodes { id paymentMethods }
                pageInfo { endCursor hasNextPage }
            }
        }
    }
`

export async function readCustomerPaymentMethodIds(
    client: ReturnType<typeof createApolloClient>,
    customerId: string
): Promise<{ paymentMethodIds: string[]; response?: never } | { paymentMethodIds?: never; response: Response }> {
    let after: string | undefined
    const cursors = new Set<string>()
    do {
        const result = await client.query({
            query: CUSTOMER_PAYMENT_METHODS,
            variables: { ...(after ? { after } : {}) },
            fetchPolicy: "no-cache",
        })
        const user = result.data?.currentUser
        if (!user) return { response: craterJson({ error: "The Crater session has no authenticated user." }, 401) }
        if (!user.customers?.nodes || !user.customers.pageInfo) throw new Error("Crater returned an incomplete customer connection.")
        const customer = user.customers.nodes.find((candidate) => candidate?.id === customerId)
        if (customer) {
            if (!Array.isArray(customer.paymentMethods) || !customer.paymentMethods.every((id) => typeof id === "string" && id.trim().length > 0)) {
                throw new Error("Crater returned an invalid payment method list.")
            }
            return { paymentMethodIds: customer.paymentMethods }
        }
        const pageInfo = user.customers.pageInfo
        if (!pageInfo.hasNextPage) break
        if (!pageInfo.endCursor || cursors.has(pageInfo.endCursor)) throw new Error("Crater returned an invalid customer cursor.")
        after = pageInfo.endCursor
        cursors.add(after)
    } while (after)
    return { response: craterJson({ error: "The customer was not found." }, 404) }
}
