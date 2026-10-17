import { createApolloClient } from "@/lib/apolloClient"
import { normalizeCheckoutSelection, validateCheckoutSelection } from "@/lib/checkout/checkoutValidation"
import { craterJson, craterMutationErrorResponse, craterTransportErrorResponse, optionalString, readJsonObject, requireCraterSession, type JsonObject } from "@/lib/checkout/craterApi"
import { resolveSiteUrl } from "@/lib/siteConfig"
import type { Mutation, MutationCheckoutCreateSessionArgs, Scalars } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type CheckoutCreateSessionData = Pick<Mutation, "checkoutCreateSession">

function isCustomCheckoutConfigurationId(value: string): value is Scalars["CustomCheckoutConfigurationID"]["input"] {
    return /^gid:\/\/crater\/CustomCheckoutConfiguration\/\d+$/.test(value)
}

const CHECKOUT_CREATE_SESSION: TypedDocumentNode<CheckoutCreateSessionData, MutationCheckoutCreateSessionArgs> = gql`
    mutation CheckoutCreateSession($input: CheckoutCreateSessionInput!) {
        checkoutCreateSession(input: $input) {
            session {
                expiresAt
                id
                url
            }
            errors {
                errorCode
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
        const customerType = optionalString(requestData.customerType)
        const paymentPeriod = optionalString(requestData.paymentPeriod)
        const workflowExecutions = optionalString(requestData.workflowExecutions)
        const aiTokens = optionalString(requestData.aiTokens)
        let craterCustomCheckoutConfigurationId: Scalars["CustomCheckoutConfigurationID"]["input"] | undefined

        if (Boolean(plan) === Boolean(customCheckoutConfigurationId)) {
            return craterJson({ error: "Provide either plan or customCheckoutConfigurationId." }, 400)
        }

        if (customCheckoutConfigurationId) {
            if (!isCustomCheckoutConfigurationId(customCheckoutConfigurationId)) {
                return craterJson({ error: "customCheckoutConfigurationId must be a valid Crater global ID." }, 400)
            }

            craterCustomCheckoutConfigurationId = customCheckoutConfigurationId
        }

        if (!customCheckoutConfigurationId && deploymentType !== "cloud" && deploymentType !== "self_hosted") {
            return craterJson({ error: "deploymentType must be cloud or self_hosted for a regular checkout." }, 400)
        }

        if (namespaceId && deploymentType !== "cloud") {
            return craterJson({ error: "namespaceId is only allowed for cloud deployments." }, 400)
        }

        if (!customCheckoutConfigurationId) {
            const { getSubscriptionConfig } = await import("@/lib/cms")
            const subscriptionConfig = await getSubscriptionConfig()

            if (!subscriptionConfig) {
                return craterJson({ error: "Subscription configuration is unavailable." }, 503)
            }

            const normalizedSelection = normalizeCheckoutSelection(
                {
                    plan,
                    customerType,
                    paymentPeriod,
                    workflowExecutions,
                    aiTokens,
                },
                subscriptionConfig
            )
            const validation = validateCheckoutSelection(normalizedSelection, subscriptionConfig)

            if (!validation.valid) {
                return craterJson(
                    {
                        error: "The checkout configuration is invalid.",
                        details: validation.details,
                    },
                    400
                )
            }
        }

        const siteUrl = resolveSiteUrl()
        const input: MutationCheckoutCreateSessionArgs["input"] = {
            successUrl: new URL("/checkout/success", siteUrl).toString(),
            cancelUrl: new URL("/checkout", siteUrl).toString(),
            ...(craterCustomCheckoutConfigurationId
                ? { customCheckoutConfigurationId: craterCustomCheckoutConfigurationId }
                : {
                      plan,
                      deploymentType,
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
