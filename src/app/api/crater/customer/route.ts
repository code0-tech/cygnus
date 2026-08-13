import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterMutationErrorResponse, craterTransportErrorResponse, optionalString, readJsonObject, readOptionalAddress, requireCraterSession } from "@/lib/checkout/craterApi"
import type { Mutation, MutationCustomersCreateArgs, MutationCustomersUpdateArgs, Query, Scalars } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type CustomersCreateData = Pick<Mutation, "customersCreate">
type CustomersUpdateData = Pick<Mutation, "customersUpdate">
type CustomersQueryData = Pick<Query, "currentUser">

function isCustomerId(value: string): value is Scalars["CustomerID"]["input"] {
    return /^gid:\/\/crater\/Customer\/\d+$/.test(value)
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
        status
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

const CUSTOMERS_CREATE: TypedDocumentNode<CustomersCreateData, MutationCustomersCreateArgs> = gql`
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

const CUSTOMERS_UPDATE: TypedDocumentNode<CustomersUpdateData, MutationCustomersUpdateArgs> = gql`
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

const CUSTOMERS: TypedDocumentNode<CustomersQueryData, Record<string, never>> = gql`
    query CheckoutCustomers {
        currentUser {
            customers(first: 100) {
                nodes {
                    ...CustomerFields
                }
            }
        }
    }
    ${CUSTOMER_FIELDS}
`

export async function GET(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    try {
        const result = await createApolloClient(session.token).query({
            query: CUSTOMERS,
            fetchPolicy: "no-cache",
        })
        const currentUser = result.data?.currentUser

        if (!currentUser) return craterJson({ error: "The Crater session has no authenticated user." }, 401)

        return craterJson({ customers: (currentUser.customers?.nodes ?? []).filter((customer) => Boolean(customer?.id)) })
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
    const customerType = optionalString(body?.customerType)
    const email = optionalString(body?.email)
    const name = optionalString(body?.name)
    const phone = optionalString(body?.phone)
    const taxIdType = optionalString(body?.taxIdType)
    const taxIdValue = optionalString(body?.taxIdValue)
    const checkoutKey = optionalString(body?.checkoutKey)
    const draft = body?.draft
    const reuseExisting = body?.reuseExisting
    const address = readOptionalAddress(body?.address)

    if (
        !body ||
        (customerType !== "business" && customerType !== "personal") ||
        address === null ||
        (draft !== undefined && typeof draft !== "boolean") ||
        (reuseExisting !== undefined && typeof reuseExisting !== "boolean")
    ) {
        return craterJson({ error: "customerType is required; address, draft, and reuseExisting must be valid when provided." }, 400)
    }

    if ((draft === true && !checkoutKey) || (draft !== true && Boolean(checkoutKey))) {
        return craterJson({ error: "checkoutKey is required for draft customers and is only allowed with draft: true." }, 400)
    }

    if (Boolean(taxIdType) !== Boolean(taxIdValue)) {
        return craterJson({ error: "taxIdType and taxIdValue must be provided together." }, 400)
    }

    try {
        const result = await createApolloClient(session.token).mutate({
            mutation: CUSTOMERS_CREATE,
            variables: {
                input: {
                    customerType,
                    ...(address && Object.keys(address).length > 0 ? { address } : {}),
                    ...(checkoutKey ? { checkoutKey } : {}),
                    ...(typeof draft === "boolean" ? { draft } : {}),
                    ...(email ? { email } : {}),
                    ...(name ? { name } : {}),
                    ...(phone ? { phone } : {}),
                    ...(typeof reuseExisting === "boolean" ? { reuseExisting } : {}),
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

        if (payload.customer.customerType !== customerType) {
            return craterJson(
                {
                    error: "The existing customer type does not match the requested checkout customer type.",
                    errorCode: "CUSTOMER_TYPE_MISMATCH",
                    details: [],
                },
                409
            )
        }

        return craterJson(payload.customer, 201)
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
    const email = optionalString(body?.email)
    const name = optionalString(body?.name)
    const phone = optionalString(body?.phone)
    const address = readOptionalAddress(body?.address)

    if (!body || !id || !isCustomerId(id) || address === null) {
        return craterJson({ error: "A valid Crater customer id is required and address must be valid when provided." }, 400)
    }

    if (!email && !name && !phone && !address) {
        return craterJson({ error: "Provide at least one customer field to update." }, 400)
    }

    try {
        const result = await createApolloClient(session.token).mutate({
            mutation: CUSTOMERS_UPDATE,
            variables: {
                input: {
                    id,
                    ...(address ? { address } : {}),
                    ...(email ? { email } : {}),
                    ...(name ? { name } : {}),
                    ...(phone ? { phone } : {}),
                },
            },
        })
        const payload = result.data?.customersUpdate

        if (!payload) throw new Error("Crater returned no customer update payload.")

        const errorResponse = craterMutationErrorResponse(payload.errors, "Crater could not update the customer.")
        if (errorResponse) return errorResponse
        if (!payload.customer) throw new Error("Crater returned no updated customer.")

        return craterJson(payload.customer)
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater customer update error:", error)
        return craterJson({ error: "Could not update Crater customer." }, 502)
    }
}
