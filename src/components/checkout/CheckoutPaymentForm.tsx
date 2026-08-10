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
    labels: "above",
    variables: {
        colorPrimary: "#72f896",
        colorBackground: "#201e2c",
        colorText: "#ffffff",
        colorTextSecondary: "rgba(255, 255, 255, 0.5)",
        colorTextPlaceholder: "rgba(255, 255, 255, 0.35)",
        colorDanger: "#ef5b68",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        fontSizeBase: "13px",
        fontWeightNormal: "400",
        fontWeightMedium: "400",
        spacingUnit: "4px",
        gridRowSpacing: "16px",
        borderRadius: "16px",
        inputBoxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
        inputFocusBoxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
        inputFocusColorBorder: "transparent",
        labelColorText: "rgba(255, 255, 255, 0.5)",
        labelFontSize: "11px",
        labelFontWeight: "400",
        labelSpacing: "7px",
    },
    rules: {
        ".Input": {
            backgroundColor: "#201e2c",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
            padding: "11px",
            letterSpacing: "-0.5px",
        },
        ".Input:hover": {
            backgroundColor: "rgba(191, 191, 191, 0.15)",
        },
        ".Input:focus": {
            backgroundColor: "rgba(191, 191, 191, 0.2)",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
        },
        ".Input--invalid": {
            backgroundColor: "#1c0516",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(217, 4, 41, 0.1)",
        },
        ".Label": {
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: "11px",
            fontWeight: "400",
            letterSpacing: "-0.5px",
            textTransform: "uppercase",
        },
        ".Tab": {
            backgroundColor: "#070514",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
        },
        ".Tab:hover": {
            backgroundColor: "#191825",
        },
        ".Tab--selected": {
            backgroundColor: "#201e2c",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
        },
        ".AccordionItem": {
            backgroundColor: "#070514",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
        },
        ".AccordionItem:hover": {
            backgroundColor: "#191825",
        },
        ".AccordionItem--selected": {
            backgroundColor: "#191825",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
        },
    },
} satisfies NonNullable<NonNullable<StripeCheckoutElementsSdkOptions["elementsOptions"]>["appearance"]>

interface CheckoutPaymentFormProps {
    content: CheckoutFormContent
    isAddressComplete: boolean
    onAddressComplete: (complete: boolean) => void
    onBack: () => void
    session: CheckoutSessionData
}

function CheckoutPaymentFields({ content, isAddressComplete, onAddressComplete, onBack }: Omit<CheckoutPaymentFormProps, "session">) {
    const checkoutState = useCheckoutElements()
    const { stage: activeStep, setStage } = useCheckoutStage()
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isConfirming, setIsConfirming] = useState(false)

    const showBillingAddress = () => {
        setStage("billingAddress")
        setErrorMessage(null)
    }

    const showPayment = () => {
        if (!isAddressComplete) return
        setStage("payment")
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
        <form onSubmit={handleSubmit} className="w-full space-y-6">
            {activeStep === "billingAddress" ? (
                <>
                    <section className="w-full space-y-4">
                        <BillingAddressElement onChange={(event) => onAddressComplete(event.complete)} />
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
                    <section className="w-full space-y-4">
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

export function CheckoutPaymentForm({ content, isAddressComplete, onAddressComplete, onBack, session }: CheckoutPaymentFormProps) {
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
            <CheckoutPaymentFields content={content} isAddressComplete={isAddressComplete} onAddressComplete={onAddressComplete} onBack={onBack} />
        </CheckoutElementsProvider>
    )
}
