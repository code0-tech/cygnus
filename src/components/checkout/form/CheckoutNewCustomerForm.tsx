"use client"

import { useCheckoutFormState } from "@/components/checkout/form/CheckoutFormProvider"
import { ButtonLoader } from "@/components/ui/Loader"
import { Button, EmailInput, emailValidation } from "@code0-tech/pictor"
import { AddressElement } from "@stripe/react-stripe-js"
import type { StripeCheckoutContact } from "@stripe/stripe-js"
import { useId, useState, type ReactNode } from "react"
import { CheckoutFieldLabel } from "./CheckoutFieldLabel"
import { StripeElementSlot } from "./CheckoutFormSkeleton"

type DefaultBillingAddress = { name?: string | null; address: StripeCheckoutContact["address"] }

interface CheckoutNewCustomerFormProps {
    customerSelect: ReactNode
    onSubmit: () => void
    sendOffer: ReactNode
}

export function CheckoutNewCustomerForm({ customerSelect, onSubmit, sendOffer }: CheckoutNewCustomerFormProps) {
    const emailInputId = useId()
    const { content, guestEmail, isLoading, setStripeBillingAddress, setStripeEmail, stripeBillingAddress, stripeBillingAddressComplete, stripeEmail, stripeEmailComplete } = useCheckoutFormState()
    const [isAddressReady, setIsAddressReady] = useState(false)
    // Read once on mount, after the draft has been restored: the Address Element only applies default values when it
    // mounts, so the address a visitor already entered (or restored from the draft) is shown again instead of an empty form.
    const [defaultBillingAddress] = useState<DefaultBillingAddress | undefined>(() => (stripeBillingAddress ? { name: stripeBillingAddress.name, address: stripeBillingAddress.address } : undefined))

    return (
        <form
            className="w-full space-y-6"
            onSubmit={(event) => {
                event.preventDefault()
                onSubmit()
            }}
        >
            <section className="w-full space-y-4">
                <h3 className="text-lg text-white">{content.contactHeading}</h3>
                {customerSelect}
                <div>
                    <CheckoutFieldLabel htmlFor={emailInputId}>{content.emailLabel}</CheckoutFieldLabel>
                    <EmailInput
                        id={emailInputId}
                        disabled={Boolean(guestEmail)}
                        name="email"
                        autoComplete="email"
                        maxLength={254}
                        placeholder={content.emailPlaceholder}
                        value={stripeEmail ?? ""}
                        onChange={(event) => setStripeEmail(event.currentTarget.value, emailValidation(event.currentTarget.value))}
                        className="w-full!"
                    />
                </div>
            </section>

            <section className="w-full space-y-4">
                <h3 className="text-lg text-white">{content.billingHeading}</h3>
                <StripeElementSlot heightKey="billingAddress" ready={isAddressReady}>
                    <AddressElement
                        options={{ mode: "billing", display: { name: "full" }, defaultValues: defaultBillingAddress }}
                        onChange={(event) => setStripeBillingAddress({ name: event.value.name, address: event.value.address }, event.complete)}
                        onReady={() => setIsAddressReady(true)}
                    />
                </StripeElementSlot>
            </section>

            <div className="space-y-3">
                <Button
                    type="submit"
                    variant="normal"
                    disabled={isLoading || !stripeBillingAddressComplete || !stripeEmailComplete}
                    className="h-10! w-full! whitespace-nowrap bg-white! px-8! text-sm! text-primary! ring-1! ring-white/20! hover:bg-white/90!"
                >
                    {isLoading ? <ButtonLoader label={content.processingLabel} /> : content.continueLabel}
                </Button>
                <p className="text-center text-sm text-tertiary">{content.notChargedYetText}</p>
                {sendOffer}
            </div>
        </form>
    )
}
