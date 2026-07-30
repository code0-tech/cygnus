import type { SubscriptionConfigData } from "@/lib/cms"
import type { PaymentPeriod, UsageRange } from "@/lib/subscriptionCalculator"

export type CheckoutSelection = {
    aiTokens?: string
    customerType?: string
    paymentPeriod?: string
    plan?: string
    workflowExecutions?: string
}

type CheckoutValidationResult = { valid: true } | { details: string[]; valid: false }

const PAYMENT_PERIODS = new Set<PaymentPeriod>(["monthly", "quarterly", "yearly"])

function clampUsageValue(rawValue: string | undefined, range: UsageRange) {
    if (!rawValue || !/^\d+$/.test(rawValue)) return rawValue

    const value = Number(rawValue)
    if (!Number.isSafeInteger(value)) return rawValue

    return String(Math.min(Math.max(value, range.min), range.max))
}

export function normalizeCheckoutSelection(selection: CheckoutSelection, subscriptionConfig: SubscriptionConfigData): CheckoutSelection {
    if (selection.plan !== "custom" || (selection.customerType !== "b2b" && selection.customerType !== "b2c")) {
        return selection
    }

    return {
        ...selection,
        aiTokens: clampUsageValue(selection.aiTokens, subscriptionConfig.aiTokens[selection.customerType]),
        workflowExecutions: clampUsageValue(selection.workflowExecutions, subscriptionConfig.workflowExecutions[selection.customerType]),
    }
}

function validateUsageValue(name: string, rawValue: string | undefined, range: UsageRange) {
    if (!rawValue || !/^\d+$/.test(rawValue)) {
        return `${name} must be a non-negative integer.`
    }

    const value = Number(rawValue)
    if (!Number.isSafeInteger(value)) {
        return `${name} must be a safe integer.`
    }

    if (value < range.min || value > range.max) {
        return `${name} must be between ${range.min} and ${range.max}.`
    }

    if (range.step <= 0 || (value - range.min) % range.step !== 0) {
        return `${name} must use increments of ${range.step} starting at ${range.min}.`
    }

    return null
}

export function validateCheckoutSelection(selection: CheckoutSelection, subscriptionConfig: SubscriptionConfigData): CheckoutValidationResult {
    const details: string[] = []

    if (!selection.paymentPeriod || !PAYMENT_PERIODS.has(selection.paymentPeriod as PaymentPeriod)) {
        details.push("paymentPeriod must be monthly, quarterly, or yearly.")
    }

    if (selection.plan === "custom") {
        if (selection.customerType !== "b2b" && selection.customerType !== "b2c") {
            details.push("customerType must be b2b or b2c for a custom checkout.")
        } else {
            const customerType = selection.customerType
            const workflowExecutionsError = validateUsageValue("workflowExecutions", selection.workflowExecutions, subscriptionConfig.workflowExecutions[customerType])
            const aiTokensError = validateUsageValue("aiTokens", selection.aiTokens, subscriptionConfig.aiTokens[customerType])

            if (workflowExecutionsError) details.push(workflowExecutionsError)
            if (aiTokensError) details.push(aiTokensError)
        }
    }

    return details.length > 0 ? { details, valid: false } : { valid: true }
}
