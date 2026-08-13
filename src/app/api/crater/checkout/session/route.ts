import { createApolloClient } from "@/lib/apolloClient"
import { craterJson, craterMutationErrorResponse, craterTransportErrorResponse, optionalString, readJsonObject, requireCraterSession, type JsonObject } from "@/lib/checkout/craterApi"
import { DEFAULT_CRATER_PAYMENT_PERIOD, parseCraterPaymentPeriod, toCraterPaymentPeriod } from "@/lib/checkout/craterCheckout"
import { resolveSubscriptionSelection, type SubscriptionSelection } from "@/lib/subscriptionConfigurator"
import { resolveSiteUrl } from "@/lib/siteConfig"
import { DEFAULT_LOCALE, isSupportedLocale } from "@/lib/i18n"
import type { Mutation, MutationCheckoutCreateSessionArgs, Scalars } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type CheckoutCreateSessionData = Pick<Mutation, "checkoutCreateSession">

function isCustomCheckoutConfigurationId(value: string): value is Scalars["CustomCheckoutConfigurationID"]["input"] {
    return /^gid:\/\/crater\/CustomCheckoutConfiguration\/\d+$/.test(value)
}

function isCustomerId(value: string): value is Scalars["CustomerID"]["input"] {
    return /^gid:\/\/crater\/Customer\/\d+$/.test(value)
}

const CHECKOUT_CREATE_SESSION: TypedDocumentNode<CheckoutCreateSessionData, MutationCheckoutCreateSessionArgs> = gql`
    mutation CheckoutCreateSession($input: CheckoutCreateSessionInput!) {
        checkoutCreateSession(input: $input) {
            session {
                clientSecret
                expiresAt
                id
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
        const customerId = optionalString(requestData.customerId)
        const customCheckoutConfigurationId = optionalString(requestData.customCheckoutConfigurationId)
        const deploymentType = optionalString(requestData.deploymentType)
        const namespaceId = optionalString(requestData.namespaceId)
        const promotionCode = optionalString(requestData.promotionCode)
        const requestedLocale = optionalString(requestData.locale)
        const customerType = optionalString(requestData.customerType)
        const paymentPeriod = optionalString(requestData.paymentPeriod)
        const workflowExecutions = optionalString(requestData.workflowExecutions)
        const aiTokens = optionalString(requestData.aiTokens)
        const additionalFeatures = optionalString(requestData.additionalFeatures)
        let craterCustomCheckoutConfigurationId: Scalars["CustomCheckoutConfigurationID"]["input"] | undefined
        let normalizedSelection: SubscriptionSelection | undefined

        if (requestedLocale && !isSupportedLocale(requestedLocale)) {
            return craterJson({ error: "locale must be a supported locale." }, 400)
        }

        const locale = requestedLocale ?? DEFAULT_LOCALE

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

        let normalizedPlan = plan ?? undefined

        if (!customCheckoutConfigurationId) {
            const { getSubscriptionConfig } = await import("@/lib/cms")
            const subscriptionConfig = await getSubscriptionConfig()

            if (!subscriptionConfig) {
                return craterJson({ error: "Subscription configuration is unavailable." }, 503)
            }

            const resolvedSelection = resolveSubscriptionSelection(
                {
                    plan,
                    deploymentType,
                    customerType,
                    paymentPeriod,
                    workflowExecutions,
                    aiTokens,
                    additionalFeatures,
                },
                subscriptionConfig
            )

            if (resolvedSelection.issues.length) {
                return craterJson(
                    {
                        error: "The checkout configuration is invalid.",
                        details: resolvedSelection.issues.map((issue) => issue.message),
                    },
                    400
                )
            }

            normalizedSelection = resolvedSelection.selection
            normalizedPlan = normalizedSelection.plan
        }

        if (!customerId || !isCustomerId(customerId)) {
            return craterJson({ error: "customerId must be a valid Crater global ID." }, 400)
        }

        const siteUrl = resolveSiteUrl()
        const customConfigurationPaymentPeriod = parseCraterPaymentPeriod(paymentPeriod)
        if (customCheckoutConfigurationId && paymentPeriod && !customConfigurationPaymentPeriod) {
            return craterJson({ error: "paymentPeriod must be weekly, monthly, quarterly, or yearly." }, 400)
        }

        const input: MutationCheckoutCreateSessionArgs["input"] = {
            customerId,
            returnUrl: `${new URL(`/${locale}/checkout/success`, siteUrl).toString()}?session_id={CHECKOUT_SESSION_ID}&customer_id=${encodeURIComponent(customerId)}&checkout_started_at=${Date.now()}`,
            paymentPeriod: normalizedSelection ? toCraterPaymentPeriod(normalizedSelection.paymentPeriod) : (customConfigurationPaymentPeriod ?? DEFAULT_CRATER_PAYMENT_PERIOD),
            ...(craterCustomCheckoutConfigurationId
                ? { customCheckoutConfigurationId: craterCustomCheckoutConfigurationId }
                : {
                      plan: normalizedPlan,
                      deploymentType,
                      ...(namespaceId ? { namespaceId } : {}),
                      ...(normalizedSelection?.plan === "custom"
                          ? {
                                aiTokens: normalizedSelection.aiTokens,
                                workflowExecutions: normalizedSelection.workflowExecutions,
                            }
                          : {}),
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

        if (!payload.session?.clientSecret) {
            throw new Error("Crater returned no checkout client secret.")
        }

        return craterJson({
            clientSecret: payload.session.clientSecret,
            expiresAt: payload.session.expiresAt,
            id: payload.session.id,
        })
    } catch (error) {
        const transportResponse = craterTransportErrorResponse(error)
        if (transportResponse) return transportResponse

        console.error("Crater checkout session error:", error)
        return craterJson({ error: "Could not create checkout session." }, 502)
    }
}
