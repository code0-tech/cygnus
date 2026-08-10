import type { PaymentPeriod } from "@/lib/subscriptionCalculator"
import type { MutationCheckoutCalculateTaxArgs, MutationCheckoutCreateSessionArgs } from "@code0-tech/crater-graphql-types"

export type CraterCheckoutPaymentPeriod = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY"

type CraterCheckoutSelectionInput = {
    paymentPeriod: CraterCheckoutPaymentPeriod
    aiTokens?: number
    workflowExecutions?: number
}

export type CheckoutCreateSessionVariables = {
    input: MutationCheckoutCreateSessionArgs["input"] & CraterCheckoutSelectionInput
}

export type CheckoutCalculateTaxVariables = {
    input: MutationCheckoutCalculateTaxArgs["input"] & CraterCheckoutSelectionInput
}

const CRATER_PAYMENT_PERIODS = {
    weekly: "WEEKLY",
    monthly: "MONTHLY",
    quarterly: "QUARTERLY",
    yearly: "YEARLY",
} as const satisfies Record<PaymentPeriod, CraterCheckoutPaymentPeriod>

export function toCraterPaymentPeriod(paymentPeriod: PaymentPeriod): CraterCheckoutPaymentPeriod {
    return CRATER_PAYMENT_PERIODS[paymentPeriod]
}

export function parseCraterPaymentPeriod(paymentPeriod: string | undefined): CraterCheckoutPaymentPeriod | null {
    return paymentPeriod && Object.hasOwn(CRATER_PAYMENT_PERIODS, paymentPeriod) ? CRATER_PAYMENT_PERIODS[paymentPeriod as PaymentPeriod] : null
}
