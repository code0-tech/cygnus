import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterMutationErrorResponse, craterTransportErrorResponse, optionalString, readJsonObject, requireCraterSession, type CraterMutationError } from "@/lib/craterApi"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type CheckoutValidateDiscountData = {
    checkoutValidateDiscount: {
        discount: {
            amountOff: number | null
            code: string
            currency: string | null
            duration: string
            percentOff: number | null
        } | null
        errors: CraterMutationError[]
    }
}

type CheckoutValidateDiscountVariables = {
    input: {
        code: string
    }
}

const CHECKOUT_VALIDATE_DISCOUNT: TypedDocumentNode<CheckoutValidateDiscountData, CheckoutValidateDiscountVariables> = gql`
    mutation CheckoutValidateDiscount($input: CheckoutValidateDiscountInput!) {
        checkoutValidateDiscount(input: $input) {
            discount {
                amountOff
                code
                currency
                duration
                percentOff
            }
            errors {
                errorCode
            }
        }
    }
`

export async function POST(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    const body = await readJsonObject(request)
    const code = optionalString(body?.code)

    if (!body || !code) {
        return craterJson({ error: "code is required." }, 400)
    }

    try {
        const result = await createApolloClient(session.token).mutate({
            mutation: CHECKOUT_VALIDATE_DISCOUNT,
            variables: { input: { code } },
        })
        const payload = result.data?.checkoutValidateDiscount

        if (!payload) throw new Error("Crater returned no discount payload.")

        const errorResponse = craterMutationErrorResponse(payload.errors, "Crater could not validate the discount.")
        if (errorResponse) return errorResponse
        if (!payload.discount) throw new Error("Crater returned no discount.")

        return craterJson(payload.discount)
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater discount validation error:", error)
        return craterJson({ error: "Could not validate checkout discount." }, 502)
    }
}
