"use client"

import type { CheckoutData } from "@/lib/cms"
import type { CheckoutSessionData } from "@/lib/checkout/checkoutSubmission"
import { useCheckoutStage } from "@/components/checkout/CheckoutStepper"
import { Button } from "@code0-tech/pictor"
import { BillingAddressElement, CheckoutElementsProvider, PaymentElement, useCheckoutElements } from "@stripe/react-stripe-js/checkout"
import { loadStripe, type StripeCheckoutElementsSdkOptions } from "@stripe/stripe-js"
import { useMemo, useState } from "react"

type CheckoutFormContent = CheckoutData["form"]

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null
const stripeAppearance = {
    theme: "night",
    variables: {
        colorPrimary: "#72f896",
        colorBackground: "#1b1928",
        colorText: "#ffffff",
        colorTextSecondary: "#b8b3c2",
        colorTextPlaceholder: "#817d8b",
        colorDanger: "#ef5b68",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        fontSizeBase: "16px",
        fontWeightNormal: "400",
        fontWeightMedium: "500",
        spacingUnit: "4px",
        gridRowSpacing: "16px",
        borderRadius: "12px",
        inputBoxShadow: "none",
        inputFocusBoxShadow: "0 0 0 1px #72f896",
        inputFocusColorBorder: "#72f896",
        labelColorText: "#b8b3c2",
        labelFontSize: "14px",
        labelFontWeight: "500",
    },
    rules: {
        ".Input": {
            backgroundColor: "#1b1928",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "none",
            padding: "12px 14px",
        },
        ".Input:hover": {
            borderColor: "rgba(255, 255, 255, 0.2)",
        },
        ".Input--invalid": {
            borderColor: "#ef5b68",
            boxShadow: "0 0 0 1px #ef5b68",
        },
        ".Tab": {
            backgroundColor: "#1b1928",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "none",
        },
        ".Tab:hover": {
            borderColor: "rgba(255, 255, 255, 0.2)",
        },
        ".Tab--selected": {
            borderColor: "#72f896",
            boxShadow: "0 0 0 1px #72f896",
        },
    },
} satisfies NonNullable<NonNullable<StripeCheckoutElementsSdkOptions["elementsOptions"]>["appearance"]>

interface CheckoutPaymentFormProps {
    content: CheckoutFormContent
    onBack: () => void
    session: CheckoutSessionData
}

function CheckoutPaymentFields({ content, onAddressComplete, onBack }: Pick<CheckoutPaymentFormProps, "content" | "onBack"> & { onAddressComplete: (complete: boolean) => void }) {
    const checkoutState = useCheckoutElements()
    const [isAddressComplete, setIsAddressComplete] = useState(false)
    const [activeStep, setActiveStep] = useState<"billingAddress" | "payment">("billingAddress")
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isConfirming, setIsConfirming] = useState(false)

    const showBillingAddress = () => {
        setActiveStep("billingAddress")
        setErrorMessage(null)
        onAddressComplete(false)
    }

    const showPayment = () => {
        if (!isAddressComplete) return
        setActiveStep("payment")
        onAddressComplete(true)
    }

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (checkoutState.type !== "success" || isConfirming) return

        setIsConfirming(true)
        setErrorMessage(null)
        try {
            const result = await checkoutState.checkout.confirm({ redirect: "always" })

            if (result.type === "error") {
                setErrorMessage(result.error.message)
                setIsConfirming(false)
            }
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : content.paymentErrorFallback)
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
        <form onSubmit={handleSubmit} className="space-y-5">
            {activeStep === "billingAddress" ? (
                <>
                    <section className="rounded-2xl border border-white/5 bg-white/[0.025] p-4 sm:p-5">
                        <h2 className="mb-4 text-base font-medium text-white">{content.billingHeading}</h2>
                        <BillingAddressElement onChange={(event) => setIsAddressComplete(event.complete)} />
                    </section>

                    <div className="space-y-3">
                        <Button
                            type="button"
                            variant="normal"
                            disabled={!isAddressComplete}
                            onClick={showPayment}
                            className="h-10! w-full! whitespace-nowrap bg-white/80! px-8! text-sm! text-primary! ring-1! ring-white/20! hover:bg-white!"
                        >
                            {content.continueLabel}
                        </Button>
                        <Button
                            type="button"
                            variant="normal"
                            onClick={onBack}
                            className="h-10! w-full! border-white/10! bg-white/[0.03]! text-sm! text-secondary! hover:bg-white/[0.06]! hover:text-white!"
                        >
                            {content.backToBillingLabel}
                        </Button>
                    </div>
                </>
            ) : (
                <>
                    <section className="space-y-4 rounded-2xl border border-white/5 bg-white/[0.025] p-4 sm:p-5">
                    <h2 className="text-base font-medium text-white">{content.paymentHeading}</h2>
                    <PaymentElement />
                    </section>

                    {errorMessage && (
                        <p className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error" role="alert">
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
                        <Button
                            type="button"
                            variant="normal"
                            disabled={isConfirming}
                            onClick={showBillingAddress}
                            className="h-10! w-full! border-white/10! bg-white/[0.03]! text-sm! text-secondary! hover:bg-white/[0.06]! hover:text-white!"
                        >
                            {content.backToBillingLabel}
                        </Button>
                    </div>
                </>
            )}
        </form>
    )
}

export function CheckoutPaymentForm({ content, onBack, session }: CheckoutPaymentFormProps) {
    const { setStage } = useCheckoutStage()
    const options = useMemo<StripeCheckoutElementsSdkOptions>(
        () => ({
            clientSecret: session.clientSecret,
            elementsOptions: { appearance: stripeAppearance },
        }),
        [session.clientSecret]
    )

    if (!stripePromise) {
        return <p className="text-sm text-error">Stripe is not configured.</p>
    }

    return (
        <CheckoutElementsProvider key={session.clientSecret} stripe={stripePromise} options={options}>
            <CheckoutPaymentFields content={content} onAddressComplete={(complete) => setStage(complete ? "payment" : "billingAddress")} onBack={onBack} />
        </CheckoutElementsProvider>
    )
}
