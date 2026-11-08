import { CRATER_ERROR_FIELDS, craterJson, runCraterResourceMutation, withCraterSession } from "@/lib/crater/api.server"
import { prepareCustomerPaymentMethodRemoval } from "@/lib/crater/customerPaymentMethods.server"
import { readCustomerCreateRequest, readCustomerUpdateRequest } from "@/lib/crater/customer/requests.server"
import { CUSTOMER_FIELDS, loadCustomerPage, MAX_CUSTOMER_CURSOR_LENGTH, normalizeCustomer } from "@/lib/crater/customer/customerList.server"
import type { Mutation, MutationCustomersCreateArgs, MutationCustomersUpdateArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type CustomersCreateData = Pick<Mutation, "customersCreate">
type CustomersCreateVariables = MutationCustomersCreateArgs
type CustomersUpdateData = Pick<Mutation, "customersUpdate">
type CustomersUpdateVariables = MutationCustomersUpdateArgs

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

export const GET = withCraterSession({ log: "Crater customer list error", error: "Could not load Crater customers." }, async (request, token) => {
    const after = new URL(request.url).searchParams.get("after")?.trim() || undefined
    if (after && after.length > MAX_CUSTOMER_CURSOR_LENGTH) return craterJson({ error: "The customer cursor is invalid." }, 400)

    const page = await loadCustomerPage(token, after)
    if (!page) return craterJson({ error: "The Crater session has no authenticated user." }, 401)
    return craterJson(page)
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
