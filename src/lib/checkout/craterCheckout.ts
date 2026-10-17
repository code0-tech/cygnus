import type { PaymentPeriod } from "@/lib/subscriptionCalculator"
import type { CheckoutPaymentPeriod, CheckoutPlan } from "@code0-tech/crater-graphql-types"

const CRATER_PAYMENT_PERIODS = {
    monthly: "MONTHLY" as CheckoutPaymentPeriod,
    quarterly: "QUARTERLY" as CheckoutPaymentPeriod,
    yearly: "YEARLY" as CheckoutPaymentPeriod,
} as const satisfies Record<PaymentPeriod, CheckoutPaymentPeriod>

export function toCraterPaymentPeriod(paymentPeriod: PaymentPeriod): CheckoutPaymentPeriod {
    return CRATER_PAYMENT_PERIODS[paymentPeriod]
}

export function parseCraterPaymentPeriod(paymentPeriod: string | undefined): CheckoutPaymentPeriod | null {
    return paymentPeriod && Object.hasOwn(CRATER_PAYMENT_PERIODS, paymentPeriod) ? CRATER_PAYMENT_PERIODS[paymentPeriod as PaymentPeriod] : null
}

const CRATER_PLANS = {
    pro: "PRO",
    max: "MAX",
    custom: "CUSTOM",
} as const satisfies Record<string, `${CheckoutPlan}`>

// The package ships declaration-only const enums, so these values cannot be imported at runtime.
export function toCraterPlan(plan: keyof typeof CRATER_PLANS): CheckoutPlan {
    return CRATER_PLANS[plan] as CheckoutPlan
}

export function parseCraterPlan(plan: string): CheckoutPlan | null {
    return Object.hasOwn(CRATER_PLANS, plan) ? toCraterPlan(plan as keyof typeof CRATER_PLANS) : null
}
