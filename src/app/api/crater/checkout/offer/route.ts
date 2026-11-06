import { guestCheckoutId, readGuestCheckoutSession } from "@/lib/checkout/guestCheckoutSession"
import { CRATER_ERROR_FIELDS, craterJson, runCraterMutation, withCraterSession } from "@/lib/crater/api.server"
import { isCustomerId, isValidEmail, optionalString, parseCheckoutQuantity, readJsonObject } from "@/lib/crater/request"
import { parseCraterPaymentPeriod, parseCraterPlan } from "@/lib/crater/values"
import type { DeploymentType, Mutation, MutationQuotesCreateArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type QuotesCreateData = Pick<Mutation, "quotesCreate">

const QUOTES_CREATE: TypedDocumentNode<QuotesCreateData, MutationQuotesCreateArgs> = gql`
    ${CRATER_ERROR_FIELDS}
    mutation QuotesCreate($input: QuotesCreateInput!) {
        quotesCreate(input: $input) {
            errors {
                ...CraterErrorFields
            }
        }
    }
`

export const POST = withCraterSession({ log: "Crater offer error", error: "Could not send the offer.", rateLimit: "offer" }, async (request, token) => {
    const body = await readJsonObject(request)
    if (!body) return craterJson({ error: "A JSON request body is required." }, 400)

    const customerId = optionalString(body.customerId)
    const deploymentType = optionalString(body.deploymentType)
    const plan = parseCraterPlan(optionalString(body.plan) ?? "")
    const paymentPeriod = parseCraterPaymentPeriod(optionalString(body.paymentPeriod))
    const aiTokens = parseCheckoutQuantity(body.aiTokens)
    const workflowExecutions = parseCheckoutQuantity(body.workflowExecutions)
    const email = guestCheckoutId(request) !== null ? readGuestCheckoutSession(request)?.email : optionalString(body.email)

    if (!customerId || !isCustomerId(customerId)) {
        return craterJson({ error: "customerId is required and must be a valid Crater global ID." }, 400)
    }
    if (!email || !isValidEmail(email)) return craterJson({ error: "A valid email is required to send the offer." }, 400)
    if (deploymentType !== "cloud" && deploymentType !== "self_hosted") {
        return craterJson({ error: "deploymentType must be cloud or self_hosted." }, 400)
    }
    if (!plan) return craterJson({ error: "plan must be pro, max, or custom." }, 400)
    if (!paymentPeriod) return craterJson({ error: "paymentPeriod must be monthly, quarterly, or yearly." }, 400)
    if (Number.isNaN(aiTokens) || Number.isNaN(workflowExecutions)) {
        return craterJson({ error: "aiTokens and workflowExecutions must be positive GraphQL integers when provided." }, 400)
    }

    const result = await runCraterMutation(
        token,
        QUOTES_CREATE,
        {
            input: {
                customerId,
                email,
                plan,
                paymentPeriod,
                deploymentType: (deploymentType === "cloud" ? "CLOUD" : "SELF_HOSTED") as DeploymentType,
                ...(aiTokens !== undefined ? { aiTokens } : {}),
                ...(workflowExecutions !== undefined ? { workflowExecutions } : {}),
            },
        },
        (data) => data.quotesCreate,
        "Crater could not send the offer."
    )
    return result.response ?? craterJson({ sent: true }, 201)
})
