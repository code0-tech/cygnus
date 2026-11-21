import { createApolloClient } from "@/lib/apolloClient"
import { normalizeCraterCustomerType } from "@/lib/crater/values"
import type { Customer, Query } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export function normalizeCustomer<T extends Pick<Customer, "customerType">>(customer: T): T {
    const customerType = normalizeCraterCustomerType(customer.customerType)
    return customerType ? { ...customer, customerType } : customer
}

export const CUSTOMER_FIELDS = gql`
    fragment CustomerFields on Customer {
        address {
            city
            country
            line1
            line2
            postalCode
            state
        }
        createdAt
        customerType
        email
        id
        name
        phone
        taxId {
            taxIdType
            taxIdValue
        }
        updatedAt
    }
`

const CURRENT_CUSTOMER: TypedDocumentNode<Pick<Query, "currentUser">, Record<string, never>> = gql`
    query CheckoutCustomer {
        currentUser {
            customer {
                ...CustomerFields
            }
        }
    }
    ${CUSTOMER_FIELDS}
`

/**
 * The single customer of the session's user, `customer: null` before `customersCreate` ran. Returns `null` when Crater
 * resolves no user for the session, which `currentUser` answers instead of an error.
 */
export async function loadCurrentCustomer(token: string) {
    const result = await createApolloClient(token).query({ query: CURRENT_CUSTOMER, fetchPolicy: "no-cache" })
    const currentUser = result.data?.currentUser
    if (!currentUser) return null

    const customer = currentUser.customer
    return { customer: customer?.id ? normalizeCustomer(customer) : null }
}
