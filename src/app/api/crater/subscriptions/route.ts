import { SUBSCRIPTION_PENDING_UPDATE_FIELDS } from "@/lib/crater/subscriptionFragments"
import { CRATER_ERROR_FIELDS, craterJson, runCraterResourceMutation, withCraterSession } from "@/lib/crater/api.server"
import { parseSubscriptionChangeFields } from "@/lib/crater/request"
import { readSubscriptionRequest } from "@/lib/crater/subscriptionRequests.server"
import { normalizeCraterPaymentPeriod, normalizeCraterPlan } from "@/lib/crater/values"
import { mapSubscriptionPendingUpdate } from "@/lib/licenses/dashboardMapper"
import type { Mutation, MutationSubscriptionsUpdateArgs } from "@code0-tech/crater-graphql-types"
import { gql, type TypedDocumentNode } from "@apollo/client"

export const runtime = "nodejs"

type SubscriptionsUpdateData = Pick<Mutation, "subscriptionsUpdate">

const SUBSCRIPTIONS_UPDATE: TypedDocumentNode<SubscriptionsUpdateData, MutationSubscriptionsUpdateArgs> = gql`
    ${CRATER_ERROR_FIELDS}
    ${SUBSCRIPTION_PENDING_UPDATE_FIELDS}
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
                pendingUpdate {
                    ...SubscriptionPendingUpdateFields
                }
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
    const input = await readSubscriptionRequest(request)
    if (input.response) return input.response
    const { id, body } = input.data

    const fields = parseSubscriptionChangeFields(body, true)
    if ("error" in fields) return craterJson({ error: fields.error }, 400)

    return runCraterResourceMutation(token, SUBSCRIPTIONS_UPDATE, { input: { id, ...fields } }, (data) => data.subscriptionsUpdate, {
        rejectionMessage: "Crater could not update the subscription.",
        selectResource: (payload) => payload.subscription,
        missingResourceMessage: "Crater returned no updated subscription.",
        respond: (subscription) => craterJson(normalizeSubscriptionEnums(subscription)),
    })
})
