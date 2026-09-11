"use client"

import { AddressElement, Elements } from "@stripe/react-stripe-js"
import { Button, EmailInput, emailValidation } from "@code0-tech/pictor"
import { useRef, type ReactNode } from "react"
import { useCheckoutFormState } from "./CheckoutFormProvider"
import { CheckoutErrorState, stripeAppearance, stripePromise } from "./CheckoutPaymentForm"
import { SendOfferDialog } from "./SendOfferDialog"

export function CheckoutContactForm({ customerSelect }: { customerSelect: ReactNode }) {
    const { content, customerType, continueNewCustomer, isLoading, stripeBillingAddress, stripeBillingAddressComplete, stripeEmail, stripeEmailComplete, setStripeBillingAddress, setStripeEmail } = useCheckoutFormState()
    const defaultValues = useRef(stripeBillingAddress ? {
        name: stripeBillingAddress.name,
        address: stripeBillingAddress.address,
    } : undefined)
    if (!stripePromise) return <CheckoutErrorState message="Stripe is not configured." />

    return (
        <Elements stripe={stripePromise} options={{ appearance: stripeAppearance }}>
            <form className="w-full space-y-4" onSubmit={(event) => { event.preventDefault(); void continueNewCustomer() }}>
                {customerSelect}
                <EmailInput title={content.emailLabel} name="email" autoComplete="email" maxLength={254} placeholder={content.emailPlaceholder} value={stripeEmail ?? ""} onChange={(event) => setStripeEmail(event.currentTarget.value, emailValidation(event.currentTarget.value))} className="w-full!" />
                <AddressElement options={{ mode: "billing", display: { name: "full" }, defaultValues: defaultValues.current }} onChange={(event) => setStripeBillingAddress({ name: event.value.name, address: event.value.address }, event.complete)} />
                <Button type="submit" variant="normal" disabled={isLoading || !stripeBillingAddressComplete || !stripeEmailComplete} className="h-10! w-full! whitespace-nowrap bg-white/80! px-8! text-sm! text-primary! ring-1! ring-white/20! hover:bg-white!">
                    {isLoading ? content.processingLabel : content.continueLabel}
                </Button>
                {customerType === "business" && <SendOfferDialog content={content} initialEmail={stripeEmail} />}
            </form>
        </Elements>
    )
}
