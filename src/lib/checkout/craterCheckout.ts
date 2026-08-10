import type { PaymentPeriod } from "@/lib/subscriptionCalculator"
import type { CheckoutPaymentPeriod } from "@code0-tech/crater-graphql-types"

const CRATER_PAYMENT_PERIODS = {
    weekly: "WEEKLY" as CheckoutPaymentPeriod,
    monthly: "MONTHLY" as CheckoutPaymentPeriod,
    quarterly: "QUARTERLY" as CheckoutPaymentPeriod,
    yearly: "YEARLY" as CheckoutPaymentPeriod,
} as const satisfies Record<PaymentPeriod, CheckoutPaymentPeriod>

export const DEFAULT_CRATER_PAYMENT_PERIOD = "MONTHLY" as CheckoutPaymentPeriod

export function toCraterPaymentPeriod(paymentPeriod: PaymentPeriod): CheckoutPaymentPeriod {
    return CRATER_PAYMENT_PERIODS[paymentPeriod]
}

export function parseCraterPaymentPeriod(paymentPeriod: string | undefined): CheckoutPaymentPeriod | null {
    return paymentPeriod && Object.hasOwn(CRATER_PAYMENT_PERIODS, paymentPeriod) ? CRATER_PAYMENT_PERIODS[paymentPeriod as PaymentPeriod] : null
}
