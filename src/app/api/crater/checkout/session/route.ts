import { createApolloClient } from "@/lib/apolloClient"
import {
    CRATER_ERROR_FIELDS,
    craterJson,
    craterMutationErrorResponse,
    craterTransportErrorResponse,
    optionalString,
    readJsonObject,
    requireCraterSession,
    type JsonObject,
} from "@/lib/checkout/craterApi"
import { toCraterPaymentPeriod, toCraterPlan } from "@/lib/checkout/craterCheckout"
import { resolveSubscriptionSelection } from "@/lib/subscriptionConfigurator"
import { resolveSiteUrl } from "@/lib/siteConfig"
import { DEFAULT_LOCALE, isSupportedLocale } from "@/lib/i18n"
import { enforceRateLimit } from "@/lib/security/rateLimiter"
import type { DeploymentType, Mutation, MutationCheckoutCreateSessionArgs, Scalars } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type CheckoutCreateSessionData = Pick<Mutation, "checkoutCreateSession">

// NamespaceID is opaque in Crater (Types::NamespaceIdType); the package incorrectly maps it to a Crater global ID.
type CheckoutCreateSessionVariables = {
    input: Omit<MutationCheckoutCreateSessionArgs["input"], "namespaceId"> & { namespaceId?: string }
}

function parseQuantity(value: unknown): number | undefined {
    if (value == null || value === "") return undefined
    if ((typeof value !== "string" && typeof value !== "number") || !/^\d+$/.test(String(value))) return NaN
    const quantity = Number(value)
    return Number.isInteger(quantity) && quantity > 0 && quantity <= 2_147_483_647 ? quantity : NaN
}

function isCustomerId(value: string): value is Scalars["CustomerID"]["input"] {
    return /^gid:\/\/crater\/Customer\/\d+$/.test(value)
}

const CHECKOUT_CREATE_SESSION: TypedDocumentNode<CheckoutCreateSessionData, CheckoutCreateSessionVariables> = gql`
    ${CRATER_ERROR_FIELDS}
    mutation CheckoutCreateSession($input: CheckoutCreateSessionInput!) {
        checkoutCreateSession(input: $input) {
            session {
                clientSecret
                expiresAt
                id
            }
            errors {
                ...CraterErrorFields
            }
        }
    }
`

export async function POST(request: Request) {
    const authorization = requireCraterSession(request)
    if (authorization.response) return authorization.response

    const rateLimitResponse = enforceRateLimit("checkout", request)
    if (rateLimitResponse) return rateLimitResponse

    try {
        const body = await readJsonObject(request)

        if (!body) {
            return craterJson({ error: "A JSON request body is required." }, 400)
        }

        const requestData = body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata) ? (body.metadata as JsonObject) : body
        const plan = optionalString(requestData.plan)
        const customerId = optionalString(requestData.customerId)
        const deploymentType = optionalString(requestData.deploymentType)
        const namespaceId = optionalString(requestData.namespaceId) ?? optionalString(requestData.namespace)
        const requestedLocale = optionalString(requestData.locale)
        const customerType = optionalString(requestData.customerType)
        const paymentPeriod = optionalString(requestData.paymentPeriod)
        const workflowExecutions = parseQuantity(requestData.workflowExecutions)
        const aiTokens = parseQuantity(requestData.aiTokens)
        if (requestedLocale && !isSupportedLocale(requestedLocale)) {
            return craterJson({ error: "locale must be a supported locale." }, 400)
        }

        const locale = requestedLocale ?? DEFAULT_LOCALE

        if (!plan) return craterJson({ error: "plan is required." }, 400)
        if ("customCheckoutConfigurationId" in requestData) return craterJson({ error: "customCheckoutConfigurationId is no longer supported." }, 400)

        if (deploymentType !== "cloud" && deploymentType !== "self_hosted") {
            return craterJson({ error: "deploymentType must be cloud or self_hosted for checkout." }, 400)
        }

        if (namespaceId && deploymentType !== "cloud") {
            return craterJson({ error: "namespaceId is only allowed for cloud deployments." }, 400)
        }

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

        const normalizedSelection = resolvedSelection.selection

        if (customerId && !isCustomerId(customerId)) {
            return craterJson({ error: "customerId must be a valid Crater global ID." }, 400)
        }

        if (namespaceId && Buffer.byteLength(namespaceId, "utf8") > 500) {
            return craterJson({ error: "namespaceId must be at most 500 bytes." }, 400)
        }
        if (plan === "custom" && (Number.isNaN(aiTokens) || Number.isNaN(workflowExecutions) || (aiTokens === undefined && workflowExecutions === undefined))) {
            return craterJson({ error: "Custom checkout requires at least one positive GraphQL integer quantity." }, 400)
        }

        const siteUrl = resolveSiteUrl()
        const returnUrl = new URL(`/${locale}/checkout/success`, siteUrl)
        // The success page renders what was bought from these parameters. Stripe substitutes the session id placeholder,
        // which must stay unencoded, so it is appended after everything the URL builder escapes.
        if (normalizedSelection) {
            returnUrl.searchParams.set("plan", normalizedSelection.plan)
            returnUrl.searchParams.set("customerType", normalizedSelection.customerType)
            returnUrl.searchParams.set("deploymentType", normalizedSelection.deployment)
            returnUrl.searchParams.set("paymentPeriod", normalizedSelection.paymentPeriod)
            if (normalizedSelection.plan === "custom") {
                if (aiTokens !== undefined) returnUrl.searchParams.set("aiTokens", String(aiTokens))
                if (workflowExecutions !== undefined) returnUrl.searchParams.set("workflowExecutions", String(workflowExecutions))
            }
        }
        const input: CheckoutCreateSessionVariables["input"] = {
            ...(customerId && isCustomerId(customerId) ? { customerId } : {}),
            returnUrl: `${returnUrl.toString()}${returnUrl.search ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
            paymentPeriod: toCraterPaymentPeriod(normalizedSelection.paymentPeriod),
            plan: toCraterPlan(normalizedSelection.plan),
            deploymentType: (deploymentType === "cloud" ? "CLOUD" : "SELF_HOSTED") as DeploymentType,
            ...(namespaceId ? { namespaceId } : {}),
            ...(plan === "custom"
                ? {
                      ...(aiTokens !== undefined ? { aiTokens } : {}),
                      ...(workflowExecutions !== undefined ? { workflowExecutions } : {}),
                  }
                : {}),
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
