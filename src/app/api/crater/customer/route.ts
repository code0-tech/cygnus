import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterMutationErrorResponse, craterTransportErrorResponse, optionalString, readJsonObject, readOptionalAddress, requireCraterSession } from "@/lib/checkout/craterApi"
import { normalizeCraterCustomerType, toCraterCustomerTypeEnum } from "@/lib/checkout/craterCustomer"
import type { Customer, CustomerAddressInput, Mutation, MutationCustomersUpdateArgs, Query, Scalars } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type CustomersCreateData = Pick<Mutation, "customersCreate">

// The published Crater types still describe the retired checkout draft lifecycle.
// Keep the required contact fields aligned with Crater's current CustomersCreate mutation.
type CustomersCreateVariables = {
    input: {
        address: CustomerAddressInput
        customerType: ReturnType<typeof toCraterCustomerTypeEnum>
        email: string
        name: string
        phone?: string
        taxIdType?: string
        taxIdValue?: string
    }
}

type CustomersUpdateVariables = { input: MutationCustomersUpdateArgs["input"] & { paymentMethods?: string[] } }

type CustomersUpdateData = Pick<Mutation, "customersUpdate">
type CustomersQueryData = Pick<Query, "currentUser">
type CustomersQueryVariables = { after?: string | null }

const CUSTOMER_PAGE_SIZE = 50

function isCustomerId(value: string): value is Scalars["CustomerID"]["input"] {
    return /^gid:\/\/crater\/Customer\/\d+$/.test(value)
}

// Crater answers with the CustomerType enum; every consumer of these routes reads the lowercase value.
function normalizeCustomer<T extends Pick<Customer, "customerType">>(customer: T): T {
    const customerType = normalizeCraterCustomerType(customer.customerType)
    return customerType ? { ...customer, customerType } : customer
}

const INVALID_UPDATE_VALUE = Symbol("invalid-update-value")

function nullableString(value: unknown) {
    if (value === undefined) return undefined
    if (value === null) return null
    if (typeof value !== "string") return INVALID_UPDATE_VALUE
    return value.trim() || null
}

function readUpdateAddress(value: unknown): CustomerAddressInput | undefined | typeof INVALID_UPDATE_VALUE {
    if (value === undefined) return undefined
    if (!value || typeof value !== "object" || Array.isArray(value)) return INVALID_UPDATE_VALUE

    const source = value as Record<string, unknown>
    const address: CustomerAddressInput = {}

    for (const field of ["city", "country", "line1", "line2", "postalCode", "state"] as const) {
        const nextValue = nullableString(source[field])
        if (nextValue === INVALID_UPDATE_VALUE) return INVALID_UPDATE_VALUE
        if (nextValue !== undefined) address[field] = nextValue
    }

    return address
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

const ERROR_FIELDS = gql`
    fragment ErrorFields on Error {
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
`

const CUSTOMERS_CREATE: TypedDocumentNode<CustomersCreateData, CustomersCreateVariables> = gql`
    mutation CustomersCreate($input: CustomersCreateInput!) {
        customersCreate(input: $input) {
            customer {
                ...CustomerFields
            }
            errors {
                ...ErrorFields
            }
        }
    }
    ${CUSTOMER_FIELDS}
    ${ERROR_FIELDS}
`

const CUSTOMERS_UPDATE: TypedDocumentNode<CustomersUpdateData, CustomersUpdateVariables> = gql`
    mutation CustomersUpdate($input: CustomersUpdateInput!) {
        customersUpdate(input: $input) {
            customer {
                ...CustomerFields
            }
            errors {
                ...ErrorFields
            }
        }
    }
    ${CUSTOMER_FIELDS}
    ${ERROR_FIELDS}
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

export async function GET(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    const after = new URL(request.url).searchParams.get("after")?.trim() || undefined
    if (after && after.length > 2_048) return craterJson({ error: "The customer cursor is invalid." }, 400)

    try {
        const result = await createApolloClient(session.token).query({
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
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater customer list error:", error)
        return craterJson({ error: "Could not load Crater customers." }, 502)
    }
}

export async function POST(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    const body = await readJsonObject(request)
    const customerType = normalizeCraterCustomerType(optionalString(body?.customerType))
    const email = optionalString(body?.email)
    const name = optionalString(body?.name)
    const phone = optionalString(body?.phone)
    const taxIdType = optionalString(body?.taxIdType)
    const taxIdValue = optionalString(body?.taxIdValue)
    const address = readOptionalAddress(body?.address)

    if (!body || !customerType || !name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !address || Object.keys(address).length === 0) {
        return craterJson({ error: "customerType, name, a valid email, and a non-empty address are required." }, 400)
    }

    if (Boolean(taxIdType) !== Boolean(taxIdValue)) {
        return craterJson({ error: "taxIdType and taxIdValue must be provided together." }, 400)
    }

    try {
        const result = await createApolloClient(session.token).mutate({
            mutation: CUSTOMERS_CREATE,
            variables: {
                input: {
                    customerType: toCraterCustomerTypeEnum(customerType),
                    address,
                    email,
                    name,
                    ...(phone ? { phone } : {}),
                    ...(taxIdType ? { taxIdType } : {}),
                    ...(taxIdValue ? { taxIdValue } : {}),
                },
            },
        })
        const payload = result.data?.customersCreate

        if (!payload) throw new Error("Crater returned no customer payload.")

        const errorResponse = craterMutationErrorResponse(payload.errors, "Crater could not create the customer.")
        if (errorResponse) return errorResponse
        if (!payload.customer) throw new Error("Crater returned no customer.")

        return craterJson(normalizeCustomer(payload.customer), 201)
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater customer creation error:", error)
        return craterJson({ error: "Could not create Crater customer." }, 502)
    }
}

export async function PATCH(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    const body = await readJsonObject(request)
    const id = optionalString(body?.id)
    const email = nullableString(body?.email)
    const name = nullableString(body?.name)
    const phone = nullableString(body?.phone)
    const address = readUpdateAddress(body?.address)
    const paymentMethods = body?.paymentMethods
    if (paymentMethods !== undefined && (!Array.isArray(paymentMethods) || !paymentMethods.every((id) => typeof id === "string" && id.trim().length > 0))) {
        return craterJson({ error: "paymentMethods must be an array of non-empty payment method IDs." }, 400)
    }

    if (!body || !id || !isCustomerId(id) || email === INVALID_UPDATE_VALUE || name === INVALID_UPDATE_VALUE || phone === INVALID_UPDATE_VALUE || address === INVALID_UPDATE_VALUE) {
        return craterJson({ error: "A valid Crater customer id is required and address must be valid when provided." }, 400)
    }

    if (email === undefined && name === undefined && phone === undefined && address === undefined && paymentMethods === undefined) {
        return craterJson({ error: "Provide at least one customer field to update." }, 400)
    }

    try {
        const result = await createApolloClient(session.token).mutate({
            mutation: CUSTOMERS_UPDATE,
            variables: {
                input: {
                    id,
                    ...(paymentMethods !== undefined ? { paymentMethods: paymentMethods as string[] } : {}),
                    ...(address !== undefined ? { address } : {}),
                    ...(email !== undefined ? { email } : {}),
                    ...(name !== undefined ? { name } : {}),
                    ...(phone !== undefined ? { phone } : {}),
                },
            },
        })
        const payload = result.data?.customersUpdate

        if (!payload) throw new Error("Crater returned no customer update payload.")

        const errorResponse = craterMutationErrorResponse(payload.errors, "Crater could not update the customer.")
        if (errorResponse) return errorResponse
        if (!payload.customer) throw new Error("Crater returned no updated customer.")

        return craterJson(normalizeCustomer(payload.customer))
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater customer update error:", error)
        return craterJson({ error: "Could not update Crater customer." }, 502)
    }
}
