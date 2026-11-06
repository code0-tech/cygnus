import type { PaymentPeriod } from "@/lib/subscription/types"
import type { CheckoutCompletionState } from "@code0-tech/crater-graphql-types"

export type CheckoutCompletionStatus = {
    state: `${CheckoutCompletionState}`
    customerId: string
    licenseId: string | null
    configuration: {
        aiTokens: number | null
        customerType: string
        deploymentType: string
        paymentPeriod: PaymentPeriod | null
        plan: string | null
        workflowExecutions: number | null
    } | null
    pricing: {
        currency: string
        discount: number
        subtotal: number
        tax: number
        total: number
    } | null
}

const COMPLETION_STATES = new Set<string>(["CHECKOUT_PENDING", "PAYMENT_PENDING", "FULFILLMENT_PENDING", "READY", "FAILED"])
const PAYMENT_PERIODS = new Set<string>(["monthly", "quarterly", "yearly"])

function isNullablePositiveInteger(value: unknown) {
    return value === null || (Number.isInteger(value) && Number(value) > 0)
}

function isConfiguration(value: unknown) {
    if (!value || typeof value !== "object") return false
    const configuration = value as Record<string, unknown>
    return (
        typeof configuration.customerType === "string" &&
        typeof configuration.deploymentType === "string" &&
        (configuration.plan === null || typeof configuration.plan === "string") &&
        (configuration.paymentPeriod === null || (typeof configuration.paymentPeriod === "string" && PAYMENT_PERIODS.has(configuration.paymentPeriod))) &&
        isNullablePositiveInteger(configuration.aiTokens) &&
        isNullablePositiveInteger(configuration.workflowExecutions)
    )
}

function isPricing(value: unknown) {
    if (!value || typeof value !== "object") return false
    const pricing = value as Record<string, unknown>
    if (typeof pricing.currency !== "string" || !pricing.currency.trim()) return false
    return [pricing.discount, pricing.subtotal, pricing.tax, pricing.total].every((amount) => Number.isInteger(amount) && Number(amount) >= 0)
}

export function parseCheckoutCompletionStatus(value: unknown): CheckoutCompletionStatus | null {
    if (!value || typeof value !== "object") return null
    const status = value as Record<string, unknown>
    if (typeof status.state !== "string" || !COMPLETION_STATES.has(status.state)) return null
    if (typeof status.customerId !== "string" || !status.customerId) return null
    if (status.licenseId !== null && (typeof status.licenseId !== "string" || !status.licenseId)) return null
    if ((status.state === "READY") !== (status.licenseId !== null)) return null
    if (status.configuration !== null && !isConfiguration(status.configuration)) return null
    if (status.pricing !== null && !isPricing(status.pricing)) return null

    return status as CheckoutCompletionStatus
}
