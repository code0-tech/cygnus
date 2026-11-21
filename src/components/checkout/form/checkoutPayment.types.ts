import type { CheckoutData, ErrorsContent } from "@/lib/cms"
import type { CheckoutSessionData, CheckoutStripePricingData, CheckoutTaxQuoteData } from "@/lib/checkout/client"
import type { CheckoutPromotionCodeSdk } from "@/lib/checkout/stripeCheckout"
import type { StripeCheckoutContact } from "@stripe/stripe-js"

type CheckoutFormContent = CheckoutData["form"]

export interface CheckoutPaymentFormProps {
    billingAddress: StripeCheckoutContact | null
    billingAddressComplete: boolean
    collectTaxId: boolean
    content: CheckoutFormContent
    customerEmail: string | null
    customerId: string | null
    errors: ErrorsContent
    email: string | null
    emailComplete: boolean
    emailSyncedToStripe: boolean
    isBusinessCustomer: boolean
    offerEmailLocked: boolean
    onAddressChange: (address: StripeCheckoutContact | null, complete: boolean) => void
    onEmailChange: (email: string | null, complete: boolean) => void
    onEmailSyncedChange: (synced: boolean) => void
    onTaxQuoteChange: (taxQuote: CheckoutTaxQuoteData | null) => void
    onPaymentConfirmationChange: (confirming: boolean) => void
    onPricingChange: (pricing: CheckoutStripePricingData | null) => void
    onSendOffer: (email: string) => Promise<void>
    onStripeCheckoutChange: (checkout: CheckoutPromotionCodeSdk | null) => void
    /** Replaces the checkout session on the user's request, for one Crater can no longer record consent for. */
    onRestartCheckout: () => Promise<boolean>
    onSessionExpired: () => Promise<boolean>
    onSessionLoadError: () => Promise<boolean>
    onSessionLoadErrorChange: (error: string | null) => void
    onSessionReady: () => void
    session: CheckoutSessionData
}
