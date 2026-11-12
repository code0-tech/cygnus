import { createApolloClient } from "@/lib/apolloClient"
import { normalizeCraterCustomerType } from "@/lib/crater/values"
import type { Customer, Query } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

type CustomersQueryData = Pick<Query, "currentUser">
type CustomersQueryVariables = { after?: string | null }

const CUSTOMER_PAGE_SIZE = 50
export const MAX_CUSTOMER_CURSOR_LENGTH = 2_048

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

const CUSTOMERS: TypedDocumentNode<CustomersQueryData, CustomersQueryVariables> = gql`
    query CheckoutCustomers($after: String) {
        currentUser {
            customers(after: $after, first: ${CUSTOMER_PAGE_SIZE}) {
                nodes {
                    ...CustomerFields
                }
                pageInfo {
                    endCursor
                    hasNextPage
                }
            }
        }
    }
    ${CUSTOMER_FIELDS}
`

/**
 * One page of the customers linked to the session's user. `null` when Crater resolves no user for the session, which
 * `currentUser` answers instead of an error.
 */
export async function loadCustomerPage(token: string, after?: string) {
    const result = await createApolloClient(token).query({
        query: CUSTOMERS,
        variables: { ...(after ? { after } : {}) },
        fetchPolicy: "no-cache",
    })
    const currentUser = result.data?.currentUser
    if (!currentUser) return null

    const pageInfo = currentUser.customers?.pageInfo
    return {
        customers: (currentUser.customers?.nodes ?? []).flatMap((customer) => (customer?.id ? [normalizeCustomer(customer)] : [])),
        pageInfo: {
            endCursor: pageInfo?.endCursor ?? null,
            hasNextPage: pageInfo?.hasNextPage === true,
        },
    }
}

// Bounds the paging if Crater kept returning fresh cursors; at 50 customers per page this covers 10,000 customers.
const MAX_CUSTOMER_TYPE_PAGES = 200

/** The type of one of the session user's customers, looked up in Crater rather than taken from the client. */
export async function findCustomerType(token: string, customerId: string) {
    const seenCursors = new Set<string>()
    let after: string | undefined
    for (let page = 0; page < MAX_CUSTOMER_TYPE_PAGES; page += 1) {
        const result = await loadCustomerPage(token, after)
        if (!result) return { status: "unauthenticated" as const }
        const customer = result.customers.find((candidate) => candidate.id === customerId)
        if (customer) return { status: "found" as const, customerType: normalizeCraterCustomerType(customer.customerType) }
        if (!result.pageInfo.hasNextPage) return { status: "missing" as const }
        const cursor = result.pageInfo.endCursor
        if (!cursor || seenCursors.has(cursor)) throw new Error("Crater returned an invalid customer cursor.")
        seenCursors.add(cursor)
        after = cursor
    }
    throw new Error("Crater customer lookup exceeded its page budget.")
}
