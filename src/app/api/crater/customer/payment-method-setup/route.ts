import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterMutationErrorResponse, craterTransportErrorResponse, optionalString, readJsonObject, requireCraterSession } from "@/lib/checkout/craterApi"
import { retrievePaymentMethodSetupStatus } from "@/lib/licenses/paymentMethodSetupStatus"
import type { Mutation, MutationCustomerPaymentMethodSetupCreateArgs, Query, Scalars } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type CustomerPaymentMethodSetupCreateData = Pick<Mutation, "customerPaymentMethodSetupCreate">
type CustomerPaymentMethodSetupStatusData = Pick<Query, "currentUser">

function isCustomerId(value: string): value is Scalars["CustomerID"]["input"] {
    return /^gid:\/\/crater\/Customer\/\d+$/.test(value)
}

const CUSTOMER_PAYMENT_METHOD_SETUP_CREATE: TypedDocumentNode<CustomerPaymentMethodSetupCreateData, MutationCustomerPaymentMethodSetupCreateArgs> = gql`
    mutation CustomerPaymentMethodSetupCreate($input: CustomerPaymentMethodSetupCreateInput!) {
        customerPaymentMethodSetupCreate(input: $input) {
            session {
                clientSecret
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
`

const CUSTOMER_PAYMENT_METHOD_SETUP_STATUS: TypedDocumentNode<CustomerPaymentMethodSetupStatusData, Record<string, never>> = gql`
    query CustomerPaymentMethodSetupStatus {
        currentUser {
            customers(first: 100) {
                nodes {
                    id
                }
            }
        }
    }
`

export async function GET(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    const requestUrl = new URL(request.url)
    const customerId = requestUrl.searchParams.get("customerId")?.trim() ?? ""
    const setupIntentId = requestUrl.searchParams.get("setupIntentId")?.trim() ?? ""

    if (!isCustomerId(customerId) || !/^seti_[A-Za-z0-9]+$/.test(setupIntentId)) {
        return craterJson({ error: "A valid Crater customer id and SetupIntent id are required." }, 400)
    }

    try {
        const result = await createApolloClient(session.token).query({
            query: CUSTOMER_PAYMENT_METHOD_SETUP_STATUS,
            fetchPolicy: "no-cache",
        })
        const currentUser = result.data?.currentUser
        if (!currentUser) return craterJson({ error: "The Crater session has no authenticated user." }, 401)

        const ownsCustomer = (currentUser.customers?.nodes ?? []).some((customer) => customer?.id === customerId)
        if (!ownsCustomer) return craterJson({ error: "The payment method setup was not found." }, 404)

        const craterCustomerId = customerId.slice(customerId.lastIndexOf("/") + 1)
        const status = await retrievePaymentMethodSetupStatus(setupIntentId, craterCustomerId)
        if (status === "invalid") return craterJson({ error: "The payment method setup was not found." }, 404)

        return craterJson({ status })
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater payment method setup status error:", error instanceof Error ? error.name : "UnknownError")
        return craterJson({ error: "Could not check the payment method setup status." }, 502)
    }
}

export async function POST(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    const body = await readJsonObject(request)
    const customerId = optionalString(body?.customerId)

    if (!customerId || !isCustomerId(customerId)) {
        return craterJson({ error: "A valid Crater customer id is required." }, 400)
    }

    try {
        const result = await createApolloClient(session.token).mutate({
            mutation: CUSTOMER_PAYMENT_METHOD_SETUP_CREATE,
            variables: { input: { customerId } },
        })
        const payload = result.data?.customerPaymentMethodSetupCreate

        if (!payload) throw new Error("Crater returned no payment method setup payload.")

        const errorResponse = craterMutationErrorResponse(payload.errors, "Crater could not create the payment method setup session.")
        if (errorResponse) return errorResponse

        const clientSecret = payload.session?.clientSecret
        if (!clientSecret) throw new Error("Crater returned no SetupIntent client secret.")

        return craterJson({ clientSecret }, 201)
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater payment method setup error:", error instanceof Error ? error.name : "UnknownError")
        return craterJson({ error: "Could not create the payment method setup session." }, 502)
    }
}
