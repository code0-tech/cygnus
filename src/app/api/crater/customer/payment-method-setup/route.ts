import { CRATER_ERROR_FIELDS, craterJson, runCraterResourceMutation, withCraterSession } from "@/lib/crater/api.server"
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

export const POST = withCraterSession(
    { log: "Crater payment method setup error", error: "Could not create the payment method setup session.", rateLimit: "paymentMethodSetup" },

    async (_request, token) => {
        return runCraterResourceMutation(token, CUSTOMER_PAYMENT_METHOD_SETUP_CREATE, { input: {} }, (data) => data.customerPaymentMethodSetupCreate, {
            rejectionMessage: "Crater could not create the payment method setup session.",
            selectResource: (payload) => payload.session?.clientSecret,
            missingResourceMessage: "Crater returned no SetupIntent client secret.",
            respond: (clientSecret) => craterJson({ clientSecret }, 201),
        })
    }
)
