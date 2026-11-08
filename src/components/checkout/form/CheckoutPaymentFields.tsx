"use client"

import { getStripePricingFromSession, getTaxQuoteFromSession } from "@/lib/checkout/stripeCheckout"
import { AcceptTermsCheckbox } from "@/components/forms/AcceptTermsCheckbox"
import { useCheckoutStage } from "@/components/checkout/state/CheckoutStageProvider"
import { ButtonLoader } from "@/components/ui/Loader"
import { SendOfferDialog } from "@/components/checkout/shared/SendOfferDialog"
import { Alert, Button, EmailInput } from "@code0-tech/pictor"
import { IconArrowLeft, IconLock } from "@tabler/icons-react"
import { BillingAddressElement, ContactDetailsElement, PaymentElement, TaxIdElement, useCheckoutElements } from "@stripe/react-stripe-js/checkout"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useId, useRef, useState } from "react"
import { CheckoutBillingSummary } from "./CheckoutBillingSummary"
import { CheckoutFieldLabel } from "./CheckoutFieldLabel"
import { CheckoutFormSkeleton, StripeElementSlot } from "./CheckoutFormSkeleton"
import { CheckoutStageTransition } from "./CheckoutStageTransition"
import { WithdrawalConsentCheckbox } from "./WithdrawalConsentCheckbox"
import type { CheckoutPaymentFormProps } from "./checkoutPayment.types"

function isInactiveCheckoutSessionError(message: string) {
    const normalizedMessage = message.toLowerCase()
    return (
        (normalizedMessage.includes("checkout session") && (normalizedMessage.includes("expired") || normalizedMessage.includes("no longer active") || normalizedMessage.includes("not active"))) ||
        normalizedMessage.includes("checkout-sitzung ist nicht mehr aktiv") ||
        normalizedMessage.includes("checkout-sitzung ist abgelaufen")
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
    offerEmailLocked,
    onAddressChange,
    onEmailChange,
    onEmailSyncedChange,
    onTaxQuoteChange,
    onPaymentConfirmationChange,
    onPricingChange,
    onSendOffer,
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
    const emailInputId = useId()
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isUpdatingBilling, setIsUpdatingBilling] = useState(false)
    const [isConfirming, setIsConfirming] = useState(false)
    const [acceptedTerms, setAcceptedTerms] = useState(false)
    const [acceptedWithdrawalConsent, setAcceptedWithdrawalConsent] = useState(false)
    const requiresWithdrawalConsent = !isBusinessCustomer
    const hasRequiredConsents = acceptedTerms && (!requiresWithdrawalConsent || acceptedWithdrawalConsent)
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

    // Ready means every element of the visible step has loaded, so a session that replaces another can be swapped in.
    const isStepReady = activeStep === "billingAddress" ? isContactElementReady && isAddressElementReady && isTaxIdElementReady : isPaymentElementReady
    useEffect(() => {
        if (checkoutState.type === "success" && isStepReady) onSessionReady()
    }, [checkoutState.type, isStepReady, onSessionReady])

    const liveStripeTaxDetailsKey = liveStripePricing ? JSON.stringify([liveStripePricing.billingCountry, liveStripePricing.taxLines]) : null

    useEffect(() => {
        onPricingChange(liveStripePricing)
    }, [
        liveStripePricing?.currency,
        liveStripePricing?.discountAmount,
        liveStripePricing?.subtotalPrice,
        liveStripePricing?.taxAmount,
        liveStripePricing?.taxAmountInclusive,
        liveStripePricing?.totalPrice,
        liveStripeTaxDetailsKey,
        onPricingChange,
    ])

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
                // Only a Payment Element that is about to mount can still report ready; a restored payment step's element
                // may already have done so, and resetting it then would keep the pay button disabled for good.
                if (moveToPayment) {
                    setIsPaymentElementReady(false)
                    setStage("payment")
                }
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
        if (checkoutState.type !== "success" || isConfirming || !isPaymentElementReady || !hasRequiredConsents) return

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

    // A load error keeps the placeholder too: the session is recovered or replaced by an error message above.
    if (checkoutState.type !== "success") {
        return (
            <CheckoutFormSkeleton
                billingAddress={billingAddress}
                collectTaxId={collectTaxId}
                content={content}
                customerEmail={customerEmail}
                customerSelect={customerSelectSkeleton}
                isBusinessCustomer={isBusinessCustomer}
                stage={activeStep}
            />
        )
    }

    return (
        <CheckoutStageTransition stage={activeStep}>
            {activeStep === "billingAddress" ? (
                <>
                    <section className="w-full space-y-4">
                        <h3 className="text-lg text-white">{content.contactHeading}</h3>
                        {customerSelect}
                        {customerEmail ? (
                            <div className="w-full [&_.input-wrapper]:w-full! [&_.input-wrapper]:bg-[#17151e]! [&_.input-wrapper:hover]:bg-[#17151e]!">
                                <CheckoutFieldLabel htmlFor={emailInputId}>{content.emailLabel}</CheckoutFieldLabel>
                                <EmailInput id={emailInputId} value={customerEmail} disabled className="text-secondary! opacity-100!" />
                            </div>
                        ) : (
                            <StripeElementSlot heightKey="contactDetails" ready={isContactElementReady}>
                                <ContactDetailsElement
                                    onChange={(event) => {
                                        setIsContactDetailsComplete(event.complete)
                                        onEmailChange(event.value.email || null, event.complete)
                                    }}
                                    onLoaderStart={markContactElementLoading}
                                    onReady={markContactElementReady}
                                />
                            </StripeElementSlot>
                        )}
                    </section>

                    <section className="w-full space-y-4">
                        <h3 className="text-lg text-white">{content.billingHeading}</h3>
                        <StripeElementSlot heightKey={collectTaxId ? "billingAddressWithTaxId" : "billingAddress"} ready={isAddressElementReady && isTaxIdElementReady}>
                            <div className="space-y-4">
                                <BillingAddressElement
                                    options={{ display: { name: "full" } }}
                                    onChange={(event) => {
                                        setIsBillingAddressComplete(event.complete)
                                        onAddressChange({ name: event.value.name, address: event.value.address }, event.complete)
                                    }}
                                    onLoaderStart={markAddressElementLoading}
                                    onReady={markAddressElementReady}
                                />
                                {collectTaxId && (
                                    <TaxIdElement options={{ fields: { businessName: "never" }, visibility: "auto" }} onLoaderStart={markTaxIdElementLoading} onReady={markTaxIdElementReady} />
                                )}
                            </div>
                        </StripeElementSlot>
                    </section>

                    {errorMessage && <Alert color="error">{errorMessage}</Alert>}

                    <div className="space-y-3">
                        <Button
                            type="button"
                            variant="normal"
                            disabled={!billingAddress || !email || !isBillingAddressComplete || !isContactDetailsComplete || isUpdatingBilling}
                            onClick={() => void showPayment()}
                            className="h-10! w-full! whitespace-nowrap bg-white! px-8! text-sm! text-primary! ring-1! ring-white/20! hover:bg-white/90!"
                        >
                            {isUpdatingBilling ? <ButtonLoader label={content.processingLabel} /> : content.continueLabel}
                        </Button>
                        <p className="text-center text-sm text-tertiary">{content.notChargedYetText}</p>
                        {isBusinessCustomer && <SendOfferDialog content={content} emailLocked={offerEmailLocked} initialEmail={email} onSend={onSendOffer} />}
                    </div>
                </>
            ) : (
                <>
                    <button
                        type="button"
                        disabled={isConfirming}
                        onClick={showBillingAddress}
                        className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-tertiary transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <IconArrowLeft aria-hidden="true" size={16} />
                        {content.backToBillingLabel}
                    </button>

                    {billingAddress && <CheckoutBillingSummary billingAddress={billingAddress} changeLabel={content.billingChangeLabel} disabled={isConfirming} onChange={showBillingAddress} />}

                    <form id={paymentFormId} onSubmit={handleSubmit} className="w-full space-y-4">
                        <StripeElementSlot heightKey="payment" ready={isPaymentElementReady}>
                            <PaymentElement
                                options={{ layout: "tabs", fields: { billingDetails: { name: "never", address: "never" } } }}
                                onLoaderStart={() => {
                                    setIsPaymentElementReady(false)
                                    setIsPaymentDetailsComplete(false)
                                }}
                                onReady={() => setIsPaymentElementReady(true)}
                                onChange={(event) => setIsPaymentDetailsComplete(event.complete)}
                            />
                        </StripeElementSlot>
                    </form>

                    {errorMessage && <Alert color="error">{errorMessage}</Alert>}

                    <div className="space-y-3">
                        <AcceptTermsCheckbox locale={locale} initialValue={false} formValidation={{ setValue: setAcceptedTerms, valid: true }} />
                        {requiresWithdrawalConsent && <WithdrawalConsentCheckbox text={content.withdrawalConsentText} formValidation={{ setValue: setAcceptedWithdrawalConsent, valid: true }} />}
                        <Button
                            type="submit"
                            form={paymentFormId}
                            variant="normal"
                            disabled={isConfirming || isUpdatingBilling || !isPaymentElementReady || !isPaymentDetailsComplete || !hasRequiredConsents}
                            className="h-10! w-full! whitespace-nowrap bg-white! px-8! text-sm! text-primary! ring-1! ring-white/20! hover:bg-white/90!"
                        >
                            {isConfirming ? <ButtonLoader label={content.processingLabel} /> : content.payNowLabel}
                        </Button>
                        <p className="flex items-center justify-center gap-1.5 text-center text-sm text-tertiary">
                            <IconLock aria-hidden="true" size={16} className="shrink-0" />
                            {content.securePaymentText}
                        </p>
                    </div>
                </>
            )}
        </CheckoutStageTransition>
    )
}
