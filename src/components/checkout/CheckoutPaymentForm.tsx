"use client"

import type { CheckoutData } from "@/lib/cms"
import type { CheckoutSessionData } from "@/lib/checkout/checkoutSubmission"
import { Button } from "@code0-tech/pictor"
import { BillingAddressElement, CheckoutElementsProvider, PaymentElement, useCheckoutElements } from "@stripe/react-stripe-js/checkout"
import { loadStripe, type StripeCheckoutElementsSdkOptions } from "@stripe/stripe-js"
import { useMemo, useState } from "react"

type CheckoutFormContent = CheckoutData["form"]

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null

interface CheckoutPaymentFormProps {
    content: CheckoutFormContent
    email: string
    onBack: () => void
    phone: string
    session: CheckoutSessionData
}

function CheckoutPaymentFields({ content, onBack }: Pick<CheckoutPaymentFormProps, "content" | "onBack">) {
    const checkoutState = useCheckoutElements()
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isConfirming, setIsConfirming] = useState(false)

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (checkoutState.type !== "success" || isConfirming) return

        setIsConfirming(true)
        setErrorMessage(null)
        const result = await checkoutState.checkout.confirm({ redirect: "always" })

        if (result.type === "error") {
            setErrorMessage(result.error.message)
            setIsConfirming(false)
        }
    }

    if (checkoutState.type === "loading") {
        return <div className="flex min-h-40 items-center justify-center text-sm text-secondary">{content.processingLabel}</div>
    }

    if (checkoutState.type === "error") {
        return (
            <div className="space-y-4">
                <p className="text-sm text-error" role="alert">
                    {checkoutState.error.message}
                </p>
                <Button type="button" variant="normal" onClick={onBack} className="h-10! w-full! text-sm!">
                    {content.backToBillingLabel}
                </Button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <BillingAddressElement options={{ fields: { phone: "auto" } }} />
            <PaymentElement />

            {errorMessage && (
                <p className="text-sm text-error" role="alert">
                    {errorMessage}
                </p>
            )}

            <div className="space-y-3">
                <Button
                    type="submit"
                    variant="normal"
                    disabled={isConfirming}
                    className="h-10! w-full! whitespace-nowrap bg-white/80! px-8! text-sm! text-primary! ring-1! ring-white/20! hover:bg-white!"
                >
                    {isConfirming ? content.processingLabel : content.payNowLabel}
                </Button>
                <Button type="button" variant="normal" disabled={isConfirming} onClick={onBack} className="h-10! w-full! text-sm!">
                    {content.backToBillingLabel}
                </Button>
            </div>
        </form>
    )
}

export function CheckoutPaymentForm({ content, email, onBack, phone, session }: CheckoutPaymentFormProps) {
    const options = useMemo<StripeCheckoutElementsSdkOptions>(
        () => ({
            clientSecret: session.clientSecret,
            defaultValues: {
                email: email.trim(),
                phoneNumber: phone.trim() || undefined,
            },
            elementsOptions: { appearance: { theme: "night" } },
        }),
        [email, phone, session.clientSecret]
    )

    if (!stripePromise) {
        return <p className="text-sm text-error">Stripe is not configured.</p>
    }

    return (
        <CheckoutElementsProvider key={session.clientSecret} stripe={stripePromise} options={options}>
            <CheckoutPaymentFields content={content} onBack={onBack} />
        </CheckoutElementsProvider>
    )
}
