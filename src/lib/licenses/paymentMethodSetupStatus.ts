import Stripe from "stripe"

export type PaymentMethodSetupStatus = "failed" | "invalid" | "pending" | "ready"

let stripeClient: Stripe | null = null

function getStripeClient() {
    const apiKey = process.env.STRIPE_RESTRICTED_KEY?.trim() || process.env.STRIPE_SECRET_KEY?.trim()
    if (!apiKey) throw new Error("STRIPE_RESTRICTED_KEY is required to validate payment method setup status.")

    stripeClient ??= new Stripe(apiKey)
    return stripeClient
}

function resourceId(resource: string | { id: string } | null) {
    return typeof resource === "string" ? resource : resource?.id ?? null
}

export function getPaymentMethodSetupStatus(
    setupIntent: Pick<Stripe.SetupIntent, "customer" | "metadata" | "payment_method" | "status">,
    customer: Pick<Stripe.Customer, "id" | "invoice_settings"> | Stripe.DeletedCustomer | null,
    craterCustomerId: string
): PaymentMethodSetupStatus {
    if (setupIntent.metadata?.purpose !== "default_payment_method" || setupIntent.metadata.crater_customer_id !== craterCustomerId) return "invalid"
    if (setupIntent.status === "canceled" || setupIntent.status === "requires_payment_method") return "failed"
    if (setupIntent.status !== "succeeded") return "pending"

    const paymentMethodId = resourceId(setupIntent.payment_method)
    if (!paymentMethodId || !customer || "deleted" in customer || resourceId(setupIntent.customer) !== customer.id) return "invalid"

    return resourceId(customer.invoice_settings.default_payment_method) === paymentMethodId ? "ready" : "pending"
}

export async function retrievePaymentMethodSetupStatus(setupIntentId: string, craterCustomerId: string): Promise<PaymentMethodSetupStatus> {
    try {
        const client = getStripeClient()
        const setupIntent = await client.setupIntents.retrieve(setupIntentId)

        if (setupIntent.status !== "succeeded") return getPaymentMethodSetupStatus(setupIntent, null, craterCustomerId)

        const stripeCustomerId = resourceId(setupIntent.customer)
        if (!stripeCustomerId) return "invalid"

        const customer = await client.customers.retrieve(stripeCustomerId)
        return getPaymentMethodSetupStatus(setupIntent, customer, craterCustomerId)
    } catch (error) {
        if (error instanceof Stripe.errors.StripeInvalidRequestError && error.code === "resource_missing") return "invalid"
        throw error
    }
}
