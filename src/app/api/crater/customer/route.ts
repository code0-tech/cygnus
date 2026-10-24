import { createApolloClient } from "@/lib/apolloClient"
import { CRATER_ERROR_FIELDS, craterJson, runCraterResourceMutation, withCraterSession } from "@/lib/crater/api.server"
import { prepareCustomerPaymentMethodRemoval } from "@/lib/crater/customerPaymentMethods.server"
import { readCustomerCreateRequest, readCustomerUpdateRequest } from "@/lib/crater/customer/requests.server"
import { normalizeCraterCustomerType } from "@/lib/crater/values"
import type { Customer, Mutation, MutationCustomersCreateArgs, MutationCustomersUpdateArgs, Query } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type CustomersCreateData = Pick<Mutation, "customersCreate">
type CustomersCreateVariables = MutationCustomersCreateArgs
type CustomersUpdateData = Pick<Mutation, "customersUpdate">
type CustomersUpdateVariables = MutationCustomersUpdateArgs
type CustomersQueryData = Pick<Query, "currentUser">
type CustomersQueryVariables = { after?: string | null }

const CUSTOMER_PAGE_SIZE = 50

function normalizeCustomer<T extends Pick<Customer, "customerType">>(customer: T): T {
    const customerType = normalizeCraterCustomerType(customer.customerType)
    return customerType ? { ...customer, customerType } : customer
}

const CUSTOMER_FIELDS = gql`
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
        updatedAt
    }
`

const CUSTOMERS_CREATE: TypedDocumentNode<CustomersCreateData, CustomersCreateVariables> = gql`
    mutation CustomersCreate($input: CustomersCreateInput!) {
        customersCreate(input: $input) {
            customer {
                ...CustomerFields
            }
            errors {
                ...CraterErrorFields
            }
        }
    }
    ${CUSTOMER_FIELDS}
    ${CRATER_ERROR_FIELDS}
`

const CUSTOMERS_UPDATE: TypedDocumentNode<CustomersUpdateData, CustomersUpdateVariables> = gql`
    mutation CustomersUpdate($input: CustomersUpdateInput!) {
        customersUpdate(input: $input) {
            customer {
                ...CustomerFields
            }
            errors {
                ...CraterErrorFields
            }
        }
    }
    ${CUSTOMER_FIELDS}
    ${CRATER_ERROR_FIELDS}
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

export const GET = withCraterSession({ log: "Crater customer list error", error: "Could not load Crater customers." }, async (request, token) => {
    const after = new URL(request.url).searchParams.get("after")?.trim() || undefined
    if (after && after.length > 2_048) return craterJson({ error: "The customer cursor is invalid." }, 400)

    const result = await createApolloClient(token).query({
        query: CUSTOMERS,
        variables: { ...(after ? { after } : {}) },
        fetchPolicy: "no-cache",
    })
    const currentUser = result.data?.currentUser

    if (!currentUser) return craterJson({ error: "The Crater session has no authenticated user." }, 401)

    const pageInfo = currentUser.customers?.pageInfo
    return craterJson({
        customers: (currentUser.customers?.nodes ?? []).flatMap((customer) => (customer?.id ? [normalizeCustomer(customer)] : [])),
        pageInfo: {
            endCursor: pageInfo?.endCursor ?? null,
            hasNextPage: pageInfo?.hasNextPage === true,
        },
    })
})

export const POST = withCraterSession({ log: "Crater customer creation error", error: "Could not create Crater customer.", rateLimit: "customer" }, async (request, token) => {
    const parsed = await readCustomerCreateRequest(request)
    if (parsed.response) return parsed.response
    return runCraterResourceMutation(token, CUSTOMERS_CREATE, { input: parsed.data }, (data) => data.customersCreate, {
        rejectionMessage: "Crater could not create the customer.",
        selectResource: (payload) => payload.customer,
        missingResourceMessage: "Crater returned no customer.",
        respond: (customer) => craterJson(normalizeCustomer(customer), 201),
    })
})

export const PATCH = withCraterSession({ log: "Crater customer update error", error: "Could not update Crater customer.", rateLimit: "customer" }, async (request, token) => {
    const parsed = await readCustomerUpdateRequest(request)
    if (parsed.response) return parsed.response
    const { input, removePaymentMethodId } = parsed.data
    if (removePaymentMethodId !== undefined) {
        const removal = await prepareCustomerPaymentMethodRemoval(token, input.id, removePaymentMethodId)
        if (removal.response) return removal.response
        Object.assign(input, removal.input)
    }
    return runCraterResourceMutation(token, CUSTOMERS_UPDATE, { input }, (data) => data.customersUpdate, {
        rejectionMessage: "Crater could not update the customer.",
        selectResource: (payload) => payload.customer,
        missingResourceMessage: "Crater returned no updated customer.",
        respond: (customer) => craterJson(normalizeCustomer(customer)),
    })
})
