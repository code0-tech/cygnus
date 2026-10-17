import { optionalString, type JsonObject } from "@/lib/checkout/craterApi"
import { parseCraterPaymentPeriod } from "@/lib/checkout/craterCheckout"
import type { CheckoutPaymentPeriod, Scalars } from "@code0-tech/crater-graphql-types"

export function isSubscriptionId(value: string): value is Scalars["SubscriptionID"]["input"] {
    return /^gid:\/\/crater\/Subscription\/\d+$/.test(value)
}

function parseOptionalPositiveInt(value: unknown): number | null | undefined {
    if (value === undefined || value === null) return undefined
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export type SubscriptionChangeFields = {
    plan?: string
    paymentPeriod?: CheckoutPaymentPeriod
    aiTokens?: number
    workflowExecutions?: number
}

// subscriptionsUpdate and subscriptionsPreviewUpdate take the same arguments and resolve them the same way, so both
// the billing dialog (paymentPeriod only) and the upgrade dialog (plan and/or quantities) go through this parser.
export function parseSubscriptionChangeFields(body: JsonObject | null): { error: string } | SubscriptionChangeFields {
    const plan = optionalString(body?.plan)
    const paymentPeriodParam = optionalString(body?.paymentPeriod)
    const paymentPeriod = paymentPeriodParam ? (parseCraterPaymentPeriod(paymentPeriodParam) ?? undefined) : undefined
    if (paymentPeriodParam && !paymentPeriod) return { error: "paymentPeriod must be weekly, monthly, quarterly, or yearly." }

    const aiTokens = parseOptionalPositiveInt(body?.aiTokens)
    const workflowExecutions = parseOptionalPositiveInt(body?.workflowExecutions)
    if (aiTokens === null || workflowExecutions === null) return { error: "aiTokens and workflowExecutions must be positive integers when provided." }

    if (!plan && !paymentPeriod && !aiTokens && !workflowExecutions) {
        return { error: "At least one of plan, paymentPeriod, aiTokens, or workflowExecutions is required." }
    }

    return {
        ...(plan ? { plan } : {}),
        ...(paymentPeriod ? { paymentPeriod } : {}),
        ...(aiTokens ? { aiTokens } : {}),
        ...(workflowExecutions ? { workflowExecutions } : {}),
    }
}
