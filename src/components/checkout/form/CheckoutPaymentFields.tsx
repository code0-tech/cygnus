"use client"

import { getStripePricingFromSession, getTaxQuoteFromSession } from "@/lib/checkout/stripeCheckout"
import { AcceptTermsCheckbox } from "@/components/forms/AcceptTermsCheckbox"
import { useCheckoutStage } from "@/components/checkout/state/CheckoutStageProvider"
import { ButtonLoader } from "@/components/ui/Loader"
import { SendOfferDialog } from "@/components/checkout/shared/SendOfferDialog"
import { Button, EmailInput } from "@code0-tech/pictor"
import { IconAlertTriangle } from "@tabler/icons-react"
import { BillingAddressElement, ContactDetailsElement, PaymentElement, TaxIdElement, useCheckoutElements } from "@stripe/react-stripe-js/checkout"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useId, useRef, useState } from "react"
import type { CheckoutPaymentFormProps } from "./checkoutPayment.types"

export function CheckoutErrorState({ message, onRetry, retryLabel }: { message: string; onRetry?: () => void; retryLabel?: string }) {
    return (
        <div
            role="alert"
            aria-live="assertive"
            className="flex w-full items-center gap-2 rounded-2xl border border-error/30 bg-error/10 p-4 text-error shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_12px_32px_rgba(0,0,0,0.18)]"
        >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-error/15 ring-1 ring-error/20">
                <IconAlertTriangle aria-hidden="true" size={21} stroke={1.8} />
            </span>
            <p className="min-w-0 flex-1 text-base font-medium leading-6 text-error">{message}</p>
            {onRetry && retryLabel ? (
                <Button type="button" variant="normal" onClick={onRetry} className="shrink-0 text-sm!">
                    {retryLabel}
                </Button>
            ) : null}
        </div>
    )
}

function isInactiveCheckoutSessionError(message: string) {
    const normalizedMessage = message.toLowerCase()
    return (
        (normalizedMessage.includes("checkout session") && (normalizedMessage.includes("expired") || normalizedMessage.includes("no longer active") || normalizedMessage.includes("not active"))) ||
        normalizedMessage.includes("checkout-sitzung ist nicht mehr aktiv") ||
        normalizedMessage.includes("checkout-sitzung ist abgelaufen")
    )
}

export function CheckoutPaymentFormSkeleton({ label }: { label: string }) {
    const fieldWidths = ["w-16", "w-24", "w-20", "w-14", "w-20"]

    return (
        <div role="status" aria-label={label} data-testid="checkout-form-skeleton" className="w-full animate-pulse space-y-4 motion-reduce:animate-none">
            <span className="sr-only">{label}</span>
            {fieldWidths.slice(0, 3).map((labelWidth, index) => (
                <div key={index}>
                    <div className={`mb-2 h-2.5 rounded-full bg-white/10 ${labelWidth}`} />
                    <div className="h-10 w-full rounded-2xl bg-white/[0.07] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]" />
                </div>
            ))}
            <div className="grid grid-cols-2 gap-4">
                {fieldWidths.slice(3).map((labelWidth, index) => (
                    <div key={index}>
                        <div className={`mb-2 h-2.5 rounded-full bg-white/10 ${labelWidth}`} />
                        <div className="h-10 w-full rounded-2xl bg-white/[0.07] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]" />
                    </div>
                ))}
            </div>
            <div className="h-10 w-full rounded-2xl bg-white/10" />
        </div>
    )
}

export function CheckoutPaymentFields({
    billingAddress,
    billingAddressComplete,
    collectTaxId,
    content,
    customerEmail,
    errors,
    customerSelect,
    customerSelectSkeleton,
    email,
    emailComplete,
    emailSyncedToStripe,
    isBusinessCustomer,
    onAddressChange,
    onEmailChange,
    onEmailSyncedChange,
    onTaxQuoteChange,
    onPaymentConfirmationChange,
    onPricingChange,
    onStripeCheckoutChange,
    onSessionExpired,
    onSessionLoadError,
    onSessionLoadErrorChange,
    onSessionReady,
    sessionKey,
}: Omit<CheckoutPaymentFormProps, "session"> & { sessionKey: string }) {
    const checkoutState = useCheckoutElements()
    const { stage: activeStep, setStage } = useCheckoutStage()
    const params = useParams<{ locale?: string }>()
    const locale = params?.locale === "de" ? "de" : "en"

    const paymentFormId = useId()
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isUpdatingBilling, setIsUpdatingBilling] = useState(false)
    const [isConfirming, setIsConfirming] = useState(false)
    const [acceptedTerms, setAcceptedTerms] = useState(false)
    const [isPaymentElementReady, setIsPaymentElementReady] = useState(false)
    const [isPaymentDetailsComplete, setIsPaymentDetailsComplete] = useState(false)
    const [isContactDetailsComplete, setIsContactDetailsComplete] = useState(Boolean(customerEmail) || emailComplete)
    const [isBillingAddressComplete, setIsBillingAddressComplete] = useState(billingAddressComplete)
    const [isContactElementReady, setIsContactElementReady] = useState(false)
    const [isAddressElementReady, setIsAddressElementReady] = useState(false)
    const [isTaxIdElementReady, setIsTaxIdElementReady] = useState(!collectTaxId)
    const checkoutErrorMessage = checkoutState.type === "error" ? checkoutState.error.message : null
    const liveStripePricing = checkoutState.type === "success" ? getStripePricingFromSession(checkoutState.checkout) : null
    const restoredBillingRef = useRef(false)
    const markContactElementLoading = useCallback(() => setIsContactElementReady(false), [])
    const markAddressElementLoading = useCallback(() => setIsAddressElementReady(false), [])
    const markTaxIdElementLoading = useCallback(() => setIsTaxIdElementReady(false), [])
    const markContactElementReady = useCallback(() => setIsContactElementReady(true), [])
    const markAddressElementReady = useCallback(() => setIsAddressElementReady(true), [])
    const markTaxIdElementReady = useCallback(() => setIsTaxIdElementReady(true), [])

    useEffect(() => {
        const currentUrl = new URL(window.location.href)
        if (currentUrl.searchParams.get("paymentFailed") !== "1") return

        currentUrl.searchParams.delete("paymentFailed")
        window.history.replaceState(window.history.state, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`)
        setErrorMessage(errors.paymentConfirmation)
    }, [errors.paymentConfirmation])

    useEffect(() => {
        if (checkoutState.type === "success") {
            onSessionLoadErrorChange(null)
            return
        }

        if (!checkoutErrorMessage) return

        console.error("Stripe checkout session load error:", checkoutErrorMessage)
        onSessionLoadErrorChange(null)
        if (isInactiveCheckoutSessionError(checkoutErrorMessage)) {
            void onSessionExpired().then((isRetrying) => {
                if (!isRetrying) onSessionLoadErrorChange(errors.checkoutSessionExpired)
            })
            return
        }

        void onSessionLoadError().then((isReloading) => {
            if (!isReloading) onSessionLoadErrorChange(`${errors.checkoutSession} (${checkoutErrorMessage})`)
        })
    }, [checkoutErrorMessage, checkoutState.type, errors.checkoutSession, errors.checkoutSessionExpired, onSessionExpired, onSessionLoadError, onSessionLoadErrorChange, sessionKey])

    useEffect(() => {
        if (checkoutState.type === "success" && isContactElementReady && isAddressElementReady && isTaxIdElementReady) onSessionReady()
    }, [checkoutState.type, isAddressElementReady, isContactElementReady, isTaxIdElementReady, onSessionReady])

    useEffect(() => {
        onPricingChange(liveStripePricing)
    }, [liveStripePricing?.currency, liveStripePricing?.discountAmount, liveStripePricing?.subtotalPrice, liveStripePricing?.taxAmount, liveStripePricing?.totalPrice, onPricingChange])

    useEffect(() => {
        onStripeCheckoutChange(checkoutState.type === "success" ? checkoutState.checkout : null)
    })

    useEffect(() => () => onStripeCheckoutChange(null), [onStripeCheckoutChange, sessionKey])

    useEffect(() => {
        if (!customerEmail) return
        onEmailChange(customerEmail, true)
        onEmailSyncedChange(true)
        setIsContactDetailsComplete(true)
        setIsContactElementReady(true)
    }, [customerEmail, onEmailChange, onEmailSyncedChange])

    const showBillingAddress = () => {
        setStage("billingAddress")
        setErrorMessage(null)
    }

    const updateCheckoutBilling = useCallback(
        async (moveToPayment: boolean) => {
            if (!billingAddress || !email || !isBillingAddressComplete || !isContactDetailsComplete || checkoutState.type !== "success" || isUpdatingBilling) return

            setIsUpdatingBilling(true)
            setErrorMessage(null)
            try {
                const billingResult = await checkoutState.checkout.updateBillingAddress(billingAddress)
                if (billingResult.type === "error") {
                    setErrorMessage(errors.billingAddressUpdate)
                    return
                }
                let updatedSession = billingResult.session

                if (!emailSyncedToStripe && !customerEmail && !checkoutState.checkout.email) {
                    const emailResult = await checkoutState.checkout.updateEmail(email)
                    if (emailResult.type === "error") {
                        setErrorMessage(errors.emailUpdate)
                        return
                    }
                    updatedSession = emailResult.session
                    onEmailSyncedChange(true)
                } else if (checkoutState.checkout.email) {
                    onEmailSyncedChange(true)
                }

                onTaxQuoteChange(getTaxQuoteFromSession(updatedSession))
                onPricingChange(getStripePricingFromSession(updatedSession))
                restoredBillingRef.current = true
                setIsPaymentElementReady(false)
                if (moveToPayment) setStage("payment")
            } catch (error) {
                console.error("Failed to update Stripe checkout billing details:", error)
                setErrorMessage(errors.paymentFallback)
            } finally {
                setIsUpdatingBilling(false)
            }
        },
        [
            billingAddress,
            checkoutState,
            customerEmail,
            emailSyncedToStripe,
            errors.billingAddressUpdate,
            errors.emailUpdate,
            errors.paymentFallback,
            email,
            isBillingAddressComplete,
            isContactDetailsComplete,
            isUpdatingBilling,
            onEmailSyncedChange,
            onPricingChange,
            onTaxQuoteChange,
            setStage,
        ]
    )

    const showPayment = () => updateCheckoutBilling(true)

    useEffect(() => {
        if (activeStep !== "payment" || checkoutState.type !== "success" || !billingAddress || !email || !isBillingAddressComplete || !isContactDetailsComplete || restoredBillingRef.current) return

        restoredBillingRef.current = true
        void updateCheckoutBilling(false)
    }, [activeStep, billingAddress, checkoutState.type, email, isBillingAddressComplete, isContactDetailsComplete, updateCheckoutBilling])

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (checkoutState.type !== "success" || isConfirming || !isPaymentElementReady) return

        setIsConfirming(true)
        onPaymentConfirmationChange(true)
        setErrorMessage(null)
        try {
            if (!billingAddress) {
                setIsConfirming(false)
                onPaymentConfirmationChange(false)
                setErrorMessage(errors.billingAddressUpdate)
                return
            }
            const result = await checkoutState.checkout.confirm({ redirect: "always" })

            if (result.type === "error") {
                setIsConfirming(false)
                onPaymentConfirmationChange(false)
                if (isInactiveCheckoutSessionError(result.error.message)) {
                    await onSessionExpired()
                    return
                }
                setErrorMessage(errors.paymentConfirmation)
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : ""
            setIsConfirming(false)
            onPaymentConfirmationChange(false)
            if (isInactiveCheckoutSessionError(message)) {
                await onSessionExpired()
                return
            }
            console.error("Failed to confirm the Stripe checkout payment:", error)
            setErrorMessage(errors.paymentConfirmation)
        }
    }

    if (checkoutState.type === "loading") {
        return <CheckoutPaymentFormSkeleton label={content.processingLabel} />
    }

    if (checkoutState.type === "error") {
        return <CheckoutPaymentFormSkeleton label={content.processingLabel} />
    }

    return (
        <div className="w-full space-y-6">
            {activeStep === "billingAddress" && customerSelect ? (isContactElementReady && isAddressElementReady && isTaxIdElementReady ? customerSelect : customerSelectSkeleton) : null}
            {activeStep === "billingAddress" ? (
                <>
                    <section className="w-full space-y-4">
                        {customerEmail ? (
                            <div className="w-full [&_.input-wrapper]:w-full! [&_.input-wrapper]:bg-[#17151e]! [&_.input-wrapper:hover]:bg-[#17151e]!">
                                <EmailInput title={content.emailLabel} value={customerEmail} disabled className="text-tertiary/50!" />
                            </div>
                        ) : (
                            <ContactDetailsElement
                                onChange={(event) => {
                                    setIsContactDetailsComplete(event.complete)
                                    onEmailChange(event.value.email || null, event.complete)
                                }}
                                onLoaderStart={markContactElementLoading}
                                onReady={markContactElementReady}
                            />
                        )}
                        <BillingAddressElement
                            options={{ display: { name: "full" } }}
                            onChange={(event) => {
                                setIsBillingAddressComplete(event.complete)
                                onAddressChange({ name: event.value.name, address: event.value.address }, event.complete)
                            }}
                            onLoaderStart={markAddressElementLoading}
                            onReady={markAddressElementReady}
                        />
                        {collectTaxId && <TaxIdElement options={{ fields: { businessName: "never" }, visibility: "auto" }} onLoaderStart={markTaxIdElementLoading} onReady={markTaxIdElementReady} />}
                    </section>

                    {errorMessage && (
                        <p className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error" role="alert">
                            {errorMessage}
                        </p>
                    )}

                    <div className="space-y-3">
                        <Button
                            type="button"
                            variant="normal"
                            disabled={!billingAddress || !email || !isBillingAddressComplete || !isContactDetailsComplete || isUpdatingBilling}
                            onClick={() => void showPayment()}
                            className="h-10! w-full! whitespace-nowrap bg-white/80! px-8! text-sm! text-primary! ring-1! ring-white/20! hover:bg-white!"
                        >
                            {isUpdatingBilling ? <ButtonLoader label={content.processingLabel} /> : content.continueLabel}
                        </Button>
                        {isBusinessCustomer && <SendOfferDialog content={content} initialEmail={email} />}
                    </div>
                </>
            ) : (
                <>
                    <form id={paymentFormId} onSubmit={handleSubmit} className="w-full space-y-4">
                        <PaymentElement
                            options={{ layout: "tabs", fields: { billingDetails: { name: "never", address: "never" } } }}
                            onLoaderStart={() => {
                                setIsPaymentElementReady(false)
                                setIsPaymentDetailsComplete(false)
                            }}
                            onReady={() => setIsPaymentElementReady(true)}
                            onChange={(event) => setIsPaymentDetailsComplete(event.complete)}
                        />
                    </form>

                    <AcceptTermsCheckbox locale={locale} initialValue={false} formValidation={{ setValue: setAcceptedTerms, valid: true }} />

                    {errorMessage && (
                        <p className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error" role="alert">
                            {errorMessage}
                        </p>
                    )}

                    <div className="space-y-3">
                        <Button
                            type="submit"
                            form={paymentFormId}
                            variant="normal"
                            disabled={isConfirming || isUpdatingBilling || !isPaymentElementReady || !isPaymentDetailsComplete || !acceptedTerms}
                            className="h-10! w-full! whitespace-nowrap bg-white/80! px-8! text-sm! text-primary! ring-1! ring-white/20! hover:bg-white!"
                        >
                            {isConfirming ? <ButtonLoader label={content.processingLabel} /> : content.payNowLabel}
                        </Button>
                        <Button
                            type="button"
                            variant="normal"
                            disabled={isConfirming}
                            onClick={showBillingAddress}
                            className="h-10! w-full! border-none! bg-transparent! text-sm! text-tertiary! shadow-none! hover:bg-white/6! hover:text-white! transition-colors!"
                        >
                            {content.backToBillingLabel}
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}
