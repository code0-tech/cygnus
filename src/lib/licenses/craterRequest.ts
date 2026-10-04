import { optionalString, type JsonObject } from "@/lib/checkout/craterApi"
import { parseCraterPaymentPeriod, parseCraterPlan } from "@/lib/crater/values"
import type { CheckoutPaymentPeriod, CheckoutPlan, Scalars } from "@code0-tech/crater-graphql-types"

export function isLicenseId(value: string): value is Scalars["LicenseID"]["input"] {
    return /^gid:\/\/crater\/License\/\d+$/.test(value)
}

export function isSubscriptionId(value: string): value is Scalars["SubscriptionID"]["input"] {
    return /^gid:\/\/crater\/Subscription\/\d+$/.test(value)
}

function parseOptionalPositiveInt(value: unknown): number | null | undefined {
    if (value === undefined || value === null) return undefined
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export type SubscriptionChangeFields = {
    plan?: CheckoutPlan
    paymentPeriod?: CheckoutPaymentPeriod
    aiTokens?: number
    workflowExecutions?: number
}

export function parseSubscriptionChangeFields(body: JsonObject | null, allowPaymentMethod = false): { error: string } | (SubscriptionChangeFields & { paymentMethodId?: string }) {
    const paymentMethodId = allowPaymentMethod ? optionalString(body?.paymentMethodId) : undefined
    if (allowPaymentMethod && body?.paymentMethodId !== undefined && !paymentMethodId) return { error: "A non-empty payment method id is required." }

    const planParam = optionalString(body?.plan)
    const plan = planParam ? parseCraterPlan(planParam) : undefined
    if (planParam && !plan) return { error: "plan must be pro, max, or custom." }

    const paymentPeriodParam = optionalString(body?.paymentPeriod)
    const paymentPeriod = paymentPeriodParam ? (parseCraterPaymentPeriod(paymentPeriodParam) ?? undefined) : undefined
    if (paymentPeriodParam && !paymentPeriod) return { error: "paymentPeriod must be monthly, quarterly, or yearly." }

    const aiTokens = parseOptionalPositiveInt(body?.aiTokens)
    const workflowExecutions = parseOptionalPositiveInt(body?.workflowExecutions)
    if (aiTokens === null || workflowExecutions === null) return { error: "aiTokens and workflowExecutions must be positive integers when provided." }
    if (!plan && !paymentPeriod && !aiTokens && !workflowExecutions && !paymentMethodId)
        return {
            error: allowPaymentMethod
                ? "At least one of plan, paymentPeriod, aiTokens, workflowExecutions, or paymentMethodId is required."
                : "At least one of plan, paymentPeriod, aiTokens, or workflowExecutions is required.",
        }

    return {
        ...(paymentMethodId ? { paymentMethodId } : {}),
        ...(plan ? { plan } : {}),
        ...(paymentPeriod ? { paymentPeriod } : {}),
        ...(aiTokens ? { aiTokens } : {}),
        ...(workflowExecutions ? { workflowExecutions } : {}),
    }
}
