import type { LicenseDashboardInvoice, LicenseDashboardLicense } from "@/lib/licenses/types"
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

export interface AwaitedPayment {
    invoiceId?: string
    licenseId: string
    pendingUpdateApplied?: boolean
}

const PAYMENT_POLL_INITIAL_DELAY_MS = 2_000
const PAYMENT_POLL_MAX_DELAY_MS = 10_000
export const PAYMENT_POLL_MAX_DURATION_MS = 60_000

export function getPaymentPollDelay(attempt: number) {
    return Math.min(PAYMENT_POLL_INITIAL_DELAY_MS * 2 ** Math.max(0, Math.floor(attempt)), PAYMENT_POLL_MAX_DELAY_MS)
}

export function isInvoiceOpen(invoice: LicenseDashboardInvoice) {
    return invoice.status?.trim().toLowerCase() === "open"
}

export function isAwaitedPaymentSettled(licenses: LicenseDashboardLicense[], payment: AwaitedPayment) {
    const license = licenses.find((candidate) => candidate.id === payment.licenseId)
    if (!license) return false
    if (
        payment.invoiceId &&
        license.invoices
            ?.find((invoice) => invoice.id === payment.invoiceId)
            ?.status?.trim()
            .toLowerCase() !== "paid"
    )
        return false
    return !payment.pendingUpdateApplied || !license.pendingUpdate
}
