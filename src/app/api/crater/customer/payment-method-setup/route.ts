import { CRATER_ERROR_FIELDS, craterJson, runCraterMutation, withCraterSession } from "@/lib/crater/api.server"
import { isCustomerId, optionalString, readJsonObject } from "@/lib/crater/request"
import type { Mutation, MutationCustomerPaymentMethodSetupCreateArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type CustomerPaymentMethodSetupCreateData = Pick<Mutation, "customerPaymentMethodSetupCreate">

const CUSTOMER_PAYMENT_METHOD_SETUP_CREATE: TypedDocumentNode<CustomerPaymentMethodSetupCreateData, MutationCustomerPaymentMethodSetupCreateArgs> = gql`
    ${CRATER_ERROR_FIELDS}
    mutation CustomerPaymentMethodSetupCreate($input: CustomerPaymentMethodSetupCreateInput!) {
        customerPaymentMethodSetupCreate(input: $input) {
            session {
                clientSecret
            }
            errors {
                ...CraterErrorFields
            }
        }
    }
`

export const POST = withCraterSession({ log: "Crater payment method setup error", error: "Could not create the payment method setup session." }, async (request, token) => {
    const body = await readJsonObject(request)
    const customerId = optionalString(body?.customerId)

    if (!customerId || !isCustomerId(customerId)) {
        return craterJson({ error: "A valid Crater customer id is required." }, 400)
    }

    const mutation = await runCraterMutation(
        token,
        CUSTOMER_PAYMENT_METHOD_SETUP_CREATE,
        { input: { customerId } },
        (data) => data.customerPaymentMethodSetupCreate,
        "Crater could not create the payment method setup session."
    )
    if (mutation.response) return mutation.response

    const clientSecret = mutation.payload.session?.clientSecret
    if (!clientSecret) throw new Error("Crater returned no SetupIntent client secret.")

    return craterJson({ clientSecret }, 201)
})
