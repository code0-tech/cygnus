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
