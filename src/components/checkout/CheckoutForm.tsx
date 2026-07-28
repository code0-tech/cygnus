"use client"

import type { CheckoutData } from "@/lib/cms"
import { linkButtonClassName } from "@/components/ui/LinkButton"
import { cn } from "@/lib/utils"
import { Button } from "@code0-tech/pictor"
import { AddressElement, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { useParams } from "next/navigation"
import { useState } from "react"
import { Card } from "../ui/Card"

type CheckoutFormContent = CheckoutData["form"]

const defaultFormContent: CheckoutFormContent = {
    billingHeading: "Billing Address",
    paymentHeading: "Payment Details",
    continueLabel: "Continue to Payment",
    backToBillingLabel: "Back to Billing",
    payNowLabel: "Pay now",
    processingLabel: "Processing...",
    paymentErrorFallback: "An unexpected error occurred.",
}

export function CheckoutForm({ content }: { content?: CheckoutFormContent | null }) {
    const stripe = useStripe()
    const elements = useElements()
    const params = useParams<{ locale?: string }>()
    const labels = content ?? defaultFormContent

    const [step, setStep] = useState<"billing" | "payment">("billing")
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isAddressReady, setIsAddressReady] = useState(false)
    const [isPaymentReady, setIsPaymentReady] = useState(false)

    const handleContinue = async (event: React.SubmitEvent<HTMLElement>) => {
        event.preventDefault()

        if (step === "billing") {
            if (!elements) return

            const addressElement = elements.getElement("address")
            if (addressElement) {
                setStep("payment")
                setErrorMessage(null)
                setIsPaymentReady(false)
            }
        }
    }

    const handlePayment = async (event: React.SubmitEvent<HTMLElement>) => {
        event.preventDefault()

        if (!stripe || !elements) {
            return
        }

        setIsLoading(true)
        setErrorMessage(null)

        const localePrefix = params?.locale ? `/${params.locale}` : ""
        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}${localePrefix}/checkout/success`,
            },
        })

        if (error) {
            setErrorMessage(error.message || labels.paymentErrorFallback)
            setIsLoading(false)
        }
    }

    if (step === "billing") {
        return (
            <Card variant="default" className="flex-1! h-max!">
                <form onSubmit={handleContinue} className="flex-1 space-y-6">
                    <h2 className="text-2xl text-white">{labels.billingHeading}</h2>

                    <div className="relative min-h-58">
                        {!isAddressReady && (
                            <div className="absolute inset-0 space-y-4">
                                <div className="h-13.5 w-full rounded-xl bg-white/10 animate-pulse" />
                                <div className="h-13.5 w-full rounded-xl bg-white/10 animate-pulse" />
                                <div className="h-13.5 w-full rounded-xl bg-white/10 animate-pulse" />
                            </div>
                        )}
                        <div className={isAddressReady ? "opacity-100 transition-opacity" : "opacity-0"}>
                            <AddressElement options={{ mode: "billing" }} onReady={() => setIsAddressReady(true)} />
                        </div>
                    </div>

                    {errorMessage && <div className="text-error text-sm">{errorMessage}</div>}

                    <Button
                        type="submit"
                        variant="normal"
                        disabled={!elements}
                        className="h-10! w-full! px-8! whitespace-nowrap bg-white/80! hover:bg-white! ring-1! ring-white/20! text-sm! text-primary! transition-all duration-300"
                    >
                        {labels.continueLabel}
                    </Button>
                </form>
            </Card>
        )
    }

    return (
        <Card variant="default" className="flex-1! h-max!">
            <form onSubmit={handlePayment} className="flex-1 space-y-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl text-white">{labels.paymentHeading}</h2>
                    <button
                        type="button"
                        onClick={() => {
                            setStep("billing")
                            setIsAddressReady(false)
                        }}
                        className={cn(linkButtonClassName, "rounded-[10px] border-0 py-1 pr-4 pl-2.5 hover:bg-white/10 hover:text-white after:hidden")}
                    >
                        {labels.backToBillingLabel}
                    </button>
                </div>

                <div className="relative min-h-58">
                    {!isPaymentReady && (
                        <div className="absolute inset-0 space-y-4">
                            <div className="h-12 w-full rounded-xl bg-white/10 animate-pulse" />
                            <div className="h-12 w-full rounded-xl bg-white/10 animate-pulse" />
                            <div className="h-12 w-full rounded-xl bg-white/10 animate-pulse" />
                            <div className="h-12 w-full rounded-xl bg-white/10 animate-pulse" />
                            <div className="h-12 w-full rounded-xl bg-white/10 animate-pulse" />
                        </div>
                    )}
                    <div className={isPaymentReady ? "opacity-100 transition-opacity" : "opacity-0"}>
                        <PaymentElement
                            onReady={() => setIsPaymentReady(true)}
                            options={{
                                layout: {
                                    type: "accordion",
                                    defaultCollapsed: false,
                                    radios: undefined,
                                    spacedAccordionItems: true,
                                },
                            }}
                        />
                    </div>
                </div>

                {errorMessage && <div className="text-error text-sm">{errorMessage}</div>}

                <Button
                    type="submit"
                    variant="normal"
                    disabled={!elements || isLoading}
                    className="h-10! w-full! px-8! whitespace-nowrap bg-white/80! hover:bg-white! ring-1! ring-white/20! text-primary! text-sm! transition-all duration-300"
                >
                    {isLoading ? labels.processingLabel : labels.payNowLabel}
                </Button>
            </form>
        </Card>
    )
}
