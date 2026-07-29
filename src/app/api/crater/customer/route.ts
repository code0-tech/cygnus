import { createApolloClient } from "@/lib/apolloClient"
import {
    craterJson,
    craterMutationErrorResponse,
    craterTransportErrorResponse,
    optionalString,
    readJsonObject,
    readOptionalAddress,
    requireCraterSession,
    type CraterMutationError,
} from "@/lib/craterApi"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type CustomerAddressInput = {
    city?: string
    country?: string
    line1?: string
    line2?: string
    postalCode?: string
    state?: string
}

type Customer = {
    address: CustomerAddressInput | null
    createdAt: string
    customerType: string
    email: string
    id: string
    name: string
    phone: string | null
    updatedAt: string
}

type CustomerMutationPayload = {
    customer: Customer | null
    errors: CraterMutationError[]
}

type CustomersCreateData = {
    customersCreate: CustomerMutationPayload
}

type CustomersCreateVariables = {
    input: {
        address?: CustomerAddressInput
        customerType: "business" | "personal"
        email: string
        name: string
        phone?: string
        taxIdType?: string
        taxIdValue?: string
    }
}

type CustomersUpdateData = {
    customersUpdate: CustomerMutationPayload
}

type CustomersUpdateVariables = {
    input: {
        address?: CustomerAddressInput
        email?: string
        id: string
        name?: string
        phone?: string
    }
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
        }
    }
    ${CUSTOMER_FIELDS}
`

const CUSTOMERS_UPDATE: TypedDocumentNode<CustomersUpdateData, CustomersUpdateVariables> = gql`
    mutation CustomersUpdate($input: CustomersUpdateInput!) {
        customersUpdate(input: $input) {
            customer {
                ...CustomerFields
            }
            errors {
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

    if (!body || !id || address === null) {
        return craterJson({ error: "id is required and address must be valid when provided." }, 400)
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
