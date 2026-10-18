import { guestCheckoutId } from "@/lib/checkout/guestCheckoutSession"
import { CRATER_ERROR_FIELDS, craterJson, runCraterResourceMutation, withCraterSession } from "@/lib/crater/api.server"
import { isCustomerId, optionalString, readJsonObject, type JsonObject } from "@/lib/crater/request"
import { parseCraterPaymentPeriod, parseCraterPlan } from "@/lib/crater/values"
import { resolveSiteUrl } from "@/lib/siteConfig"
import { DEFAULT_LOCALE, isSupportedLocale } from "@/lib/i18n"
import type { DeploymentType, Mutation, MutationCheckoutCreateSessionArgs } from "@code0-tech/crater-graphql-types"
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

export const POST = withCraterSession({ log: "Crater checkout session error", error: "Could not create checkout session.", rateLimit: "checkout" }, async (request, token) => {
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

    if (!customerId || !isCustomerId(customerId)) {
        return craterJson({ error: "customerId is required and must be a valid Crater global ID." }, 400)
    }

    if (namespaceId && Buffer.byteLength(namespaceId, "utf8") > 500) {
        return craterJson({ error: "namespaceId must be at most 500 bytes." }, 400)
    }

    const craterPlan = parseCraterPlan(plan)
    const craterPaymentPeriod = parseCraterPaymentPeriod(paymentPeriod)
    if (!craterPlan) return craterJson({ error: "plan must be pro, max, or custom." }, 400)
    if (!paymentPeriod || !craterPaymentPeriod) return craterJson({ error: "paymentPeriod must be monthly, quarterly, or yearly." }, 400)
    if (Number.isNaN(aiTokens) || Number.isNaN(workflowExecutions)) {
        return craterJson({ error: "aiTokens and workflowExecutions must be positive GraphQL integers when provided." }, 400)
    }

    const siteUrl = resolveSiteUrl()
    const returnUrl = new URL(`/${locale}/checkout/success`, siteUrl)
    returnUrl.searchParams.set("plan", plan)
    if (customerType === "b2b" || customerType === "b2c") returnUrl.searchParams.set("customerType", customerType)
    returnUrl.searchParams.set("deploymentType", deploymentType)
    returnUrl.searchParams.set("paymentPeriod", paymentPeriod)
    if (plan === "custom") {
        if (aiTokens !== undefined) returnUrl.searchParams.set("aiTokens", String(aiTokens))
        if (workflowExecutions !== undefined) returnUrl.searchParams.set("workflowExecutions", String(workflowExecutions))
    }
    const guestId = guestCheckoutId(request)
    if (guestId) returnUrl.searchParams.set("guestCheckout", guestId)
    const input: CheckoutCreateSessionVariables["input"] = {
        customerId,
        returnUrl: `${returnUrl.toString()}${returnUrl.search ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
        paymentPeriod: craterPaymentPeriod,
        plan: craterPlan,
        deploymentType: (deploymentType === "cloud" ? "CLOUD" : "SELF_HOSTED") as DeploymentType,
        ...(namespaceId ? { namespaceId } : {}),
        ...(aiTokens !== undefined ? { aiTokens } : {}),
        ...(workflowExecutions !== undefined ? { workflowExecutions } : {}),
    }
    return runCraterResourceMutation(token, CHECKOUT_CREATE_SESSION, { input }, (data) => data.checkoutCreateSession, {
        rejectionMessage: "Crater could not create the checkout session.",
        selectResource: (payload) => (payload.session?.clientSecret ? payload.session : null),
        missingResourceMessage: "Crater returned no checkout client secret.",
        respond: (session) =>
            craterJson({
                clientSecret: session.clientSecret,
                expiresAt: session.expiresAt,
                id: session.id,
            }),
    })
})
