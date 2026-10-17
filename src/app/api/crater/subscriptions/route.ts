import { CRATER_ERROR_FIELDS, craterJson, runCraterMutation, withCraterSession } from "@/lib/crater/api.server"
import { optionalString, readJsonObject, isSubscriptionId, parseSubscriptionChangeFields } from "@/lib/crater/request"
import { normalizeCraterPaymentPeriod, normalizeCraterPlan } from "@/lib/crater/values"
import { mapSubscriptionPendingUpdate } from "@/lib/licenses/dashboardMapper"
import type { Mutation, MutationSubscriptionsUpdateArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type SubscriptionsUpdateData = Pick<Mutation, "subscriptionsUpdate">

const SUBSCRIPTIONS_UPDATE: TypedDocumentNode<SubscriptionsUpdateData, MutationSubscriptionsUpdateArgs> = gql`
    ${CRATER_ERROR_FIELDS}
    mutation SubscriptionsUpdate($input: SubscriptionsUpdateInput!) {
        subscriptionsUpdate(input: $input) {
            subscription {
                aiTokens
                canceledAt
                currentPeriodEnd
                cancelAt
                id
                paymentMethodId
                paymentPeriod
                plan
                status
                updatedAt
                pendingUpdate { plan paymentPeriod aiTokens workflowExecutions effectiveAt }
                workflowExecutions
            }
            errors {
                ...CraterErrorFields
            }
        }
    }
`

// The dashboard updates its licenses straight from this payload, so the CheckoutPlan and
// CheckoutPaymentPeriod enums are normalized here just like in the license dashboard route.
function normalizeSubscriptionEnums(subscription: NonNullable<NonNullable<SubscriptionsUpdateData["subscriptionsUpdate"]>["subscription"]>) {
    const plan = normalizeCraterPlan(subscription.plan)
    const paymentPeriod = normalizeCraterPaymentPeriod(subscription.paymentPeriod)

    return {
        ...subscription,
        plan: plan ?? null,
        paymentPeriod: paymentPeriod ?? null,
        pendingUpdate: mapSubscriptionPendingUpdate(subscription.pendingUpdate),
    }
}

export const PATCH = withCraterSession({ log: "Crater subscription update error", error: "Could not update the Crater subscription.", rateLimit: "subscription" }, async (request, token) => {
    const body = await readJsonObject(request)
    const id = optionalString(body?.id)
    if (!id || !isSubscriptionId(id)) {
        return craterJson({ error: "A valid Crater subscription id is required." }, 400)
    }

    const fields = parseSubscriptionChangeFields(body, true)
    if ("error" in fields) return craterJson({ error: fields.error }, 400)

    const mutation = await runCraterMutation(token, SUBSCRIPTIONS_UPDATE, { input: { id, ...fields } }, (data) => data.subscriptionsUpdate, "Crater could not update the subscription.")
    if (mutation.response) return mutation.response
    if (!mutation.payload.subscription) throw new Error("Crater returned no updated subscription.")

    return craterJson(normalizeSubscriptionEnums(mutation.payload.subscription))
})
