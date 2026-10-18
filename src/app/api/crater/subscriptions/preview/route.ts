import { CRATER_ERROR_FIELDS, craterJson, runCraterResourceMutation, withCraterSession } from "@/lib/crater/api.server"
import { parseSubscriptionChangeFields } from "@/lib/crater/request"
import { readSubscriptionRequest } from "@/lib/crater/subscriptionRequests.server"
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

export const POST = withCraterSession(
    { log: "Crater subscription preview error", error: "Could not preview the Crater subscription change.", rateLimit: "subscriptionPreview" },
    async (request, token) => {
        const input = await readSubscriptionRequest(request)
        if (input.response) return input.response
        const { id, body } = input.data

        const fields = parseSubscriptionChangeFields(body)
        if ("error" in fields) return craterJson({ error: fields.error }, 400)

        return runCraterResourceMutation(token, SUBSCRIPTIONS_PREVIEW_UPDATE, { input: { id, ...fields } }, (data) => data.subscriptionsPreviewUpdate, {
            rejectionMessage: "Crater could not preview the subscription change.",
            selectResource: (payload) => payload.preview,
            missingResourceMessage: "Crater returned no subscription update preview.",
            respond: (preview) =>
                craterJson({
                    ...preview,
                    plan: normalizeCraterPlan(preview.plan) ?? null,
                    paymentPeriod: normalizeCraterPaymentPeriod(preview.paymentPeriod) ?? null,
                }),
        })
    }
)
