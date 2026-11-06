import { CRATER_ERROR_FIELDS, craterJson, runCraterResourceMutation, withCraterSession } from "@/lib/crater/api.server"
import { isInvoiceId, optionalString, readJsonObject } from "@/lib/crater/request"
import type { Mutation, MutationInvoicesPaymentSessionArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type InvoicesPaymentSessionData = Pick<Mutation, "invoicesPaymentSession">

const INVOICES_PAYMENT_SESSION: TypedDocumentNode<InvoicesPaymentSessionData, MutationInvoicesPaymentSessionArgs> = gql`
    ${CRATER_ERROR_FIELDS}
    mutation InvoicesPaymentSession($input: InvoicesPaymentSessionInput!) {
        invoicesPaymentSession(input: $input) {
            clientSecret
            errors {
                ...CraterErrorFields
            }
        }
    }
`

export const POST = withCraterSession(
    { log: "Crater invoice payment session error", error: "Could not start the invoice payment.", rateLimit: "invoicePayment" },
    async (request, token) => {
        const body = await readJsonObject(request)
        const invoiceId = optionalString(body?.invoiceId)

        if (!invoiceId || !isInvoiceId(invoiceId)) {
            return craterJson({ error: "A valid Crater invoice id is required." }, 400)
        }

        return runCraterResourceMutation(token, INVOICES_PAYMENT_SESSION, { input: { invoiceId } }, (data) => data.invoicesPaymentSession, {
            rejectionMessage: "Crater could not start the invoice payment.",
            selectResource: (payload) => payload.clientSecret,
            missingResourceMessage: "Crater returned no invoice payment client secret.",
            respond: (clientSecret) => craterJson({ clientSecret }),
        })
    }
)
