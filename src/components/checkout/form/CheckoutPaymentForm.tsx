"use client"

import { CheckoutElementsProvider } from "@stripe/react-stripe-js/checkout"
import type { StripeCheckoutElementsSdkOptions } from "@stripe/stripe-js"
import { useMemo, useRef } from "react"
import { CheckoutErrorState, CheckoutPaymentFields, CheckoutPaymentFormSkeleton } from "./CheckoutPaymentFields"
import type { CheckoutPaymentFormProps } from "./checkoutPayment.types"
import { stripeAppearance, STRIPE_APPEARANCE_VERSION } from "./stripeCheckout"
import { useStripePromise } from "@/components/providers/StripeProvider"

export { CheckoutErrorState, CheckoutPaymentFormSkeleton }

export function CheckoutPaymentForm({ billingAddress, customerEmail, email, emailSyncedToStripe, session, ...props }: CheckoutPaymentFormProps) {
    const stripePromise = useStripePromise("checkout")
    const defaultValuesRef = useRef<{
        clientSecret: string
        values: NonNullable<StripeCheckoutElementsSdkOptions["defaultValues"]>
    } | null>(null)

    if (defaultValuesRef.current?.clientSecret !== session.clientSecret) {
        defaultValuesRef.current = {
            clientSecret: session.clientSecret,
            values: {
                ...(billingAddress ? { billingAddress } : {}),
                ...(email && !customerEmail && !emailSyncedToStripe ? { email } : {}),
            },
        }
    }

    const options = useMemo<StripeCheckoutElementsSdkOptions>(
        () => ({
            clientSecret: session.clientSecret,
            ...(Object.keys(defaultValuesRef.current?.values ?? {}).length ? { defaultValues: defaultValuesRef.current?.values } : {}),
            elementsOptions: { appearance: stripeAppearance },
        }),
        [session.clientSecret]
    )

    if (!stripePromise) return <CheckoutErrorState message="Stripe is not configured." />

    return (
        <CheckoutElementsProvider key={`${session.clientSecret}:${STRIPE_APPEARANCE_VERSION}`} stripe={stripePromise} options={options}>
            <CheckoutPaymentFields {...props} billingAddress={billingAddress} customerEmail={customerEmail} email={email} emailSyncedToStripe={emailSyncedToStripe} sessionKey={session.clientSecret} />
        </CheckoutElementsProvider>
    )
}
