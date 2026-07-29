import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterMutationErrorResponse, craterTransportErrorResponse, optionalString, readJsonObject, requireCraterSession, type CraterMutationError, type JsonObject } from "@/lib/craterApi"
import { resolveSiteUrl } from "@/lib/siteConfig"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type CheckoutCreateSessionInput = {
    cancelUrl: string
    customCheckoutConfigurationId?: string
    deploymentType?: "cloud" | "self_hosted"
    namespaceId?: string
    plan?: string
    promotionCode?: string
    successUrl: string
}

type CheckoutCreateSessionData = {
    checkoutCreateSession: {
        errors: CraterMutationError[]
        session: {
            expiresAt: number | null
            id: string
            url: string | null
        } | null
    }
}

type CheckoutCreateSessionVariables = {
    input: CheckoutCreateSessionInput
}

const CHECKOUT_CREATE_SESSION: TypedDocumentNode<CheckoutCreateSessionData, CheckoutCreateSessionVariables> = gql`
    mutation CheckoutCreateSession($input: CheckoutCreateSessionInput!) {
        checkoutCreateSession(input: $input) {
            session {
                expiresAt
                id
                url
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

export async function POST(request: Request) {
    const authorization = requireCraterSession(request)
    if (authorization.response) return authorization.response

    try {
        const body = await readJsonObject(request)

        if (!body) {
            return craterJson({ error: "A JSON request body is required." }, 400)
        }

        const requestData = body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata) ? (body.metadata as JsonObject) : body
        const plan = optionalString(requestData.plan)
        const customCheckoutConfigurationId = optionalString(requestData.customCheckoutConfigurationId)
        const deploymentType = optionalString(requestData.deploymentType)
        const namespaceId = optionalString(requestData.namespaceId)
        const promotionCode = optionalString(requestData.promotionCode)

        if (Boolean(plan) === Boolean(customCheckoutConfigurationId)) {
            return craterJson({ error: "Provide either plan or customCheckoutConfigurationId." }, 400)
        }

        if (!customCheckoutConfigurationId && deploymentType !== "cloud" && deploymentType !== "self_hosted") {
            return craterJson({ error: "deploymentType must be cloud or self_hosted for a regular checkout." }, 400)
        }

        if (namespaceId && deploymentType !== "cloud") {
            return craterJson({ error: "namespaceId is only allowed for cloud deployments." }, 400)
        }

        const siteUrl = resolveSiteUrl()
        const input: CheckoutCreateSessionInput = {
            successUrl: new URL("/checkout/success", siteUrl).toString(),
            cancelUrl: new URL("/checkout", siteUrl).toString(),
            ...(customCheckoutConfigurationId
                ? { customCheckoutConfigurationId }
                : {
                      plan,
                      deploymentType: deploymentType as "cloud" | "self_hosted",
                      ...(namespaceId ? { namespaceId } : {}),
                  }),
            ...(promotionCode ? { promotionCode } : {}),
        }
        const apolloClient = createApolloClient(authorization.token)
        const result = await apolloClient.mutate({
            mutation: CHECKOUT_CREATE_SESSION,
            variables: { input },
        })
        const payload = result.data?.checkoutCreateSession

        if (!payload) {
            throw new Error("Crater returned no checkout payload.")
        }

        const errorResponse = craterMutationErrorResponse(payload.errors, "Crater could not create the checkout session.")
        if (errorResponse) return errorResponse

        if (!payload.session?.url) {
            throw new Error("Crater returned no checkout redirect URL.")
        }

        return craterJson({
            expiresAt: payload.session.expiresAt,
            id: payload.session.id,
            url: payload.session.url,
        })
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater checkout session error:", error)
        return craterJson({ error: "Could not create checkout session." }, 502)
    }
}
