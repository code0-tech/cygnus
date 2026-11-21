import { gql } from "@apollo/client"

export const SUBSCRIPTION_PENDING_UPDATE_FIELDS = gql`
    fragment SubscriptionPendingUpdateFields on SubscriptionPendingUpdate {
        plan
        paymentPeriod
        aiTokens
        workflowExecutions
        effectiveAt
    }
`

export const SUBSCRIPTION_CANCELLATION_FIELDS = gql`
    fragment SubscriptionCancellationFields on Subscription {
        cancelAt
        canceledAt
        id
        immediateCancellationAvailable
        immediateCancellationUntil
        pendingUpdate {
            ...SubscriptionPendingUpdateFields
        }
        status
        updatedAt
    }
    ${SUBSCRIPTION_PENDING_UPDATE_FIELDS}
`

const SUBSCRIPTION_USAGE_METRIC_FIELDS = gql`
    fragment SubscriptionUsageMetricFields on SubscriptionUsageMetric {
        used
        allowance
        remaining
        exceeded
    }
`

/** Read live from Sagittarius on every request, so only the license detail query selects it. */
export const SUBSCRIPTION_USAGE_FIELDS = gql`
    fragment SubscriptionUsageFields on SubscriptionUsage {
        availability
        periodStart
        periodEnd
        resetsAt
        lastUpdatedAt
        aiTokens {
            ...SubscriptionUsageMetricFields
        }
        workflowExecutions {
            ...SubscriptionUsageMetricFields
        }
    }
    ${SUBSCRIPTION_USAGE_METRIC_FIELDS}
`
