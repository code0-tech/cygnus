import Stripe from "stripe"

export type CheckoutSessionValidationStatus = "complete" | "incomplete" | "missing"

let stripeClient: Stripe | null = null

function getStripeClient() {
    const apiKey = process.env.STRIPE_RESTRICTED_KEY?.trim() || process.env.STRIPE_SECRET_KEY?.trim()
    if (!apiKey) throw new Error("STRIPE_RESTRICTED_KEY is required to validate checkout success sessions.")

    stripeClient ??= new Stripe(apiKey)
    return stripeClient
}

export function getCheckoutSessionValidationStatus(session: Pick<Stripe.Checkout.Session, "status">): CheckoutSessionValidationStatus {
    return session.status === "complete" ? "complete" : "incomplete"
}

export async function retrieveCheckoutSessionValidationStatus(sessionId: string): Promise<CheckoutSessionValidationStatus> {
    try {
        const session = await getStripeClient().checkout.sessions.retrieve(sessionId)
        return getCheckoutSessionValidationStatus(session)
    } catch (error) {
        if (error instanceof Stripe.errors.StripeInvalidRequestError && error.code === "resource_missing") return "missing"
        throw error
    }
}
