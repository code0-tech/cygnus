import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, withCraterSession } from "@/lib/crater/api.server"
import { readCustomerPaymentMethodIds } from "@/lib/crater/customerPaymentMethods.server"
import { isCustomerId } from "@/lib/crater/request"
import type { CustomerPaymentMethodSummary } from "@/lib/licenses/types"
import type { Query, QueryPaymentMethodArgs, PaymentMethodSummary } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type CustomerPaymentMethodData = Pick<Query, "paymentMethod">

const CUSTOMER_PAYMENT_METHOD: TypedDocumentNode<CustomerPaymentMethodData, QueryPaymentMethodArgs> = gql`
    query CustomerPaymentMethod($paymentMethodId: String!) {
        paymentMethod(paymentMethodId: $paymentMethodId) {
            brand
            expiresMonth
            expiresYear
            last4
            type
        }
    }
`

function paymentMethodSummary(id: string, method: PaymentMethodSummary | null | undefined): CustomerPaymentMethodSummary {
    return {
        id,
        brand: method?.brand ?? null,
        expiresMonth: typeof method?.expiresMonth === "number" ? method.expiresMonth : null,
        expiresYear: typeof method?.expiresYear === "number" ? method.expiresYear : null,
        last4: method?.last4 ?? null,
        type: method?.type ?? null,
    }
}

async function resolvePaymentMethods(client: ReturnType<typeof createApolloClient>, paymentMethodIds: string[]) {
    return Promise.all(
        paymentMethodIds.map(async (paymentMethodId) => {
            try {
                const result = await client.query({
                    query: CUSTOMER_PAYMENT_METHOD,
                    variables: { paymentMethodId },
                    fetchPolicy: "no-cache",
                })

                return paymentMethodSummary(paymentMethodId, result.data?.paymentMethod)
            } catch (error) {
                console.error("Crater customer payment method summary error:", error instanceof Error ? error.name : "UnknownError")
                return paymentMethodSummary(paymentMethodId, null)
            }
        })
    )
}

export const GET = withCraterSession({ log: "Crater customer payment methods error", error: "Could not load the customer's payment methods." }, async (request, token) => {
    const customerId = new URL(request.url).searchParams.get("customerId")?.trim() ?? ""
    if (!isCustomerId(customerId)) return craterJson({ error: "A valid Crater customer id is required." }, 400)

    const client = createApolloClient(token)
    const current = await readCustomerPaymentMethodIds(client, customerId)
    if (current.response) return current.response
    return craterJson({ paymentMethods: await resolvePaymentMethods(client, current.paymentMethodIds) })
})
