import { CRATER_ERROR_FIELDS, craterJson, runCraterMutation, withCraterSession } from "@/lib/crater/api.server"
import { optionalString, readJsonObject, isSubscriptionId, parseSubscriptionChangeFields } from "@/lib/crater/request"
import { normalizeCraterPaymentPeriod, normalizeCraterPlan } from "@/lib/crater/values"
import type { Mutation, MutationSubscriptionsPreviewUpdateArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type SubscriptionsPreviewUpdateData = Pick<Mutation, "subscriptionsPreviewUpdate">

const SUBSCRIPTIONS_PREVIEW_UPDATE: TypedDocumentNode<SubscriptionsPreviewUpdateData, MutationSubscriptionsPreviewUpdateArgs> = gql`
    ${CRATER_ERROR_FIELDS}
    mutation SubscriptionsPreviewUpdate($input: SubscriptionsPreviewUpdateInput!) {
        subscriptionsPreviewUpdate(input: $input) {
            preview {
                aiTokens
                currency
                effectiveAt
                immediate
                paymentPeriod
                plan
                prorationAmount
                total
                workflowExecutions
            }
            errors {
                ...CraterErrorFields
            }
        }
    }
`

export const POST = withCraterSession({ log: "Crater subscription preview error", error: "Could not preview the Crater subscription change." }, async (request, token) => {
    const body = await readJsonObject(request)
    const id = optionalString(body?.id)
    if (!id || !isSubscriptionId(id)) {
        return craterJson({ error: "A valid Crater subscription id is required." }, 400)
    }

    const fields = parseSubscriptionChangeFields(body)
    if ("error" in fields) return craterJson({ error: fields.error }, 400)

    const mutation = await runCraterMutation(
        token,
        SUBSCRIPTIONS_PREVIEW_UPDATE,
        { input: { id, ...fields } },
        (data) => data.subscriptionsPreviewUpdate,
        "Crater could not preview the subscription change."
    )
    if (mutation.response) return mutation.response
    const { preview } = mutation.payload
    if (!preview) throw new Error("Crater returned no subscription update preview.")

    return craterJson({
        ...preview,
        plan: normalizeCraterPlan(preview.plan) ?? null,
        paymentPeriod: normalizeCraterPaymentPeriod(preview.paymentPeriod) ?? null,
    })
})
