import type { PaymentIntent, Stripe } from "@stripe/stripe-js"

export type PaymentConfirmationOutcome = "succeeded" | "processing" | "failed"

function outcomeOf(status: PaymentIntent.Status | undefined): PaymentConfirmationOutcome {
    if (status === "succeeded") return "succeeded"
    if (status === "processing") return "processing"
    return "failed"
}

export async function confirmInvoicePayment(stripe: Stripe | null, clientSecret: string): Promise<PaymentConfirmationOutcome> {
    if (!stripe) return "failed"

    const retrieved = await stripe.retrievePaymentIntent(clientSecret)
    if (retrieved.error || !retrieved.paymentIntent) return "failed"
    if (retrieved.paymentIntent.status !== "requires_action") return outcomeOf(retrieved.paymentIntent.status)

    const result = await stripe.handleNextAction({ clientSecret })
    if (result.error) return "failed"
    return outcomeOf(result.paymentIntent?.status)
}

export const PAYMENT_WEBHOOK_SETTLE_MS = 3_000

export function reloadAfterPayment(reload: () => void) {
    reload()
    window.setTimeout(reload, PAYMENT_WEBHOOK_SETTLE_MS)
}
