import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterMutationErrorResponse, craterTransportErrorResponse, optionalString, readJsonObject, readOptionalAddress, requireCraterSession } from "@/lib/craterApi"
import type { Mutation, MutationCustomersCreateArgs, MutationCustomersUpdateArgs, Scalars } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type CustomersCreateData = Pick<Mutation, "customersCreate">
type CustomersUpdateData = Pick<Mutation, "customersUpdate">

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
        updatedAt
    }
`

const CUSTOMERS_CREATE: TypedDocumentNode<CustomersCreateData, MutationCustomersCreateArgs> = gql`
    mutation CustomersCreate($input: CustomersCreateInput!) {
        customersCreate(input: $input) {
            customer {
                ...CustomerFields
            }
            errors {
                errorCode
            }
        }
    }
    ${CUSTOMER_FIELDS}
`

const CUSTOMERS_UPDATE: TypedDocumentNode<CustomersUpdateData, MutationCustomersUpdateArgs> = gql`
    mutation CustomersUpdate($input: CustomersUpdateInput!) {
        customersUpdate(input: $input) {
            customer {
                ...CustomerFields
            }
            errors {
                errorCode
            }
        }
    }
    ${CUSTOMER_FIELDS}
`

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
    const address = readOptionalAddress(body?.address)

    if (!body || (customerType !== "business" && customerType !== "personal") || !email || !name || address === null) {
        return craterJson({ error: "customerType, name, email, and a valid address are required." }, 400)
    }

    if (customerType === "business" && (!taxIdType || !taxIdValue)) {
        return craterJson({ error: "taxIdType and taxIdValue are required for business customers." }, 400)
    }

    try {
        const result = await createApolloClient(session.token).mutate({
            mutation: CUSTOMERS_CREATE,
            variables: {
                input: {
                    customerType,
                    email,
                    name,
                    ...(address ? { address } : {}),
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
