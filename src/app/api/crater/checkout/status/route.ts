import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterTransportErrorResponse, requireCraterSession } from "@/lib/checkout/craterApi"
import type { Query, Scalars } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type CheckoutLicenseStatusData = Pick<Query, "currentUser">

const CHECKOUT_LICENSE_STATUS: TypedDocumentNode<CheckoutLicenseStatusData, Record<string, never>> = gql`
    query CheckoutLicenseStatus {
        currentUser {
            customers(first: 100) {
                nodes {
                    id
                    licenses(first: 100) {
                        nodes {
                            createdAt
                            id
                        }
                    }
                }
            }
        }
    }
`

function isCustomerId(value: string): value is Scalars["CustomerID"]["input"] {
    return /^gid:\/\/crater\/Customer\/\d+$/.test(value)
}

export async function GET(request: Request) {
    const session = requireCraterSession(request)
    if (session.response) return session.response

    const requestUrl = new URL(request.url)
    const customerId = requestUrl.searchParams.get("customerId")?.trim() ?? ""
    const startedAt = Number(requestUrl.searchParams.get("startedAt"))

    if (!isCustomerId(customerId) || !Number.isSafeInteger(startedAt) || startedAt <= 0 || startedAt > Date.now() + 60_000) {
        return craterJson({ error: "A valid checkout customer and start time are required." }, 400)
    }

    try {
        const result = await createApolloClient(session.token).query({
            query: CHECKOUT_LICENSE_STATUS,
            fetchPolicy: "no-cache",
        })
        const currentUser = result.data?.currentUser
        if (!currentUser) return craterJson({ error: "The Crater session has no authenticated user." }, 401)

        const customer = (currentUser.customers?.nodes ?? []).find((candidate) => candidate?.id === customerId)
        const ready = (customer?.licenses?.nodes ?? []).some((license) => Boolean(license?.id && license.createdAt && Date.parse(license.createdAt) >= startedAt))

        return craterJson({ ready })
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater checkout license status error:", error)
        return craterJson({ error: "Could not check the checkout license status." }, 502)
    }
}
