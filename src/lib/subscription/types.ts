import type { DashboardSubscriptionStatus, SubscriptionPendingUpdate } from "@/lib/licenses/types"

export const PAYMENT_PERIOD_OPTIONS = ["monthly", "quarterly", "yearly"] as const

export type PaymentPeriod = (typeof PAYMENT_PERIOD_OPTIONS)[number]

export type SubscriptionPlan = "pro" | "max" | "custom"
export type SubscriptionDeploymentMode = "self_hosted" | "cloud"
export type SubscriptionCustomerType = "b2b" | "b2c"

export type SubscriptionSelection = {
    plan: SubscriptionPlan
    deployment: SubscriptionDeploymentMode
    customerType: SubscriptionCustomerType
    paymentPeriod: PaymentPeriod
    workflowExecutions: number
    aiTokens: number
}

export type RawSubscriptionSelection = Partial<Record<"plan" | "deploymentType" | "deployment" | "customerType" | "paymentPeriod" | "workflowExecutions" | "aiTokens", string | null | undefined>>

export type SubscriptionSelectionIssue = {
    field: keyof RawSubscriptionSelection
    message: string
}

export type SubscriptionSelectionAction =
    | { type: "customerTypeChanged"; value: SubscriptionCustomerType }
    | { type: "planChanged"; value: SubscriptionPlan }
    | { type: "deploymentChanged"; value: SubscriptionDeploymentMode }
    | { type: "paymentPeriodChanged"; value: PaymentPeriod }
    | { type: "workflowExecutionsChanged"; value: number }
    | { type: "aiTokensChanged"; value: number }

export interface SubscriptionUpdateFields {
    aiTokens?: number
    paymentPeriod?: PaymentPeriod
    plan?: SubscriptionPlan
    workflowExecutions?: number
}

export interface SubscriptionUpdateRequest extends SubscriptionUpdateFields {
    id: string
}

export interface SubscriptionUpdatePreview {
    currency: string
    effectiveAt: string | null
    immediate: boolean
    prorationAmount: number
    total: number
}

export interface SubscriptionUpdateResult {
    immediateCancellationAvailable?: boolean
    immediateCancellationUntil?: string
    paymentMethodId?: string | null
    pendingUpdate?: SubscriptionPendingUpdate | null
    status?: DashboardSubscriptionStatus
    cancelAt?: string | null
    canceledAt?: string | null
    aiTokens?: number
    paymentPeriod?: string
    plan?: string
    updatedAt?: string
    workflowExecutions?: number
}
