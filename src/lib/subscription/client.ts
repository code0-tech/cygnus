import type { PaymentPeriod } from "@/lib/subscription/calculator"
import type { SubscriptionPlan } from "@/lib/subscription/configurator"

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
    aiTokens?: number
    paymentPeriod?: string
    plan?: string
    updatedAt?: string
    workflowExecutions?: number
}

async function subscriptionRequest<T extends object>(path: string, method: "PATCH" | "POST", request: SubscriptionUpdateRequest, errorMessage: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(path, {
        method,
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
        signal,
    })
    if (!response.ok) throw new Error(errorMessage)

    const result: unknown = await response.json()
    if (!result || typeof result !== "object") throw new Error(errorMessage)
    return result as T
}

export function previewSubscriptionUpdate(request: SubscriptionUpdateRequest, errorMessage: string, signal?: AbortSignal) {
    return subscriptionRequest<SubscriptionUpdatePreview>("/api/crater/subscriptions/preview", "POST", request, errorMessage, signal)
}

export function updateSubscription(request: SubscriptionUpdateRequest, errorMessage: string) {
    return subscriptionRequest<SubscriptionUpdateResult>("/api/crater/subscriptions", "PATCH", request, errorMessage)
}
