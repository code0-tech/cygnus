"use client"

import { getStripePricingFromSession, getTaxQuoteFromSession, type CheckoutTaxIdDraft } from "@/lib/checkout/stripeCheckout"
import { CheckoutSubmissionError, recordCheckoutConsent } from "@/lib/checkout/client"
import { AcceptTermsCheckbox } from "@/components/forms/AcceptTermsCheckbox"
import { useCheckoutStage } from "@/components/checkout/state/CheckoutStageProvider"
import { ButtonLoader } from "@/components/ui/Loader"
import { SendOfferDialog } from "@/components/checkout/shared/SendOfferDialog"
import { Alert, Button, EmailInput } from "@code0-tech/pictor"
import { IconArrowLeft, IconLock } from "@tabler/icons-react"
import { BillingAddressElement, ContactDetailsElement, PaymentElement, TaxIdElement, useCheckoutElements } from "@stripe/react-stripe-js/checkout"
import type { StripeAddressElement } from "@stripe/stripe-js"
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

type ConsentHighlights = { terms: boolean; withdrawal: boolean }
const NO_CONSENT_HIGHLIGHTS: ConsentHighlights = { terms: false, withdrawal: false }

export function CheckoutPaymentFields({
    billingAddress,
    billingAddressComplete,
    collectTaxId,
    content,
    customerEmail,
    errors,
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
    onRestartCheckout,
    onSendOffer,
    onStripeCheckoutChange,
    onSessionExpired,
    onSessionLoadError,
    onSessionLoadErrorChange,
    onSessionReady,
    sessionId,
    sessionKey,
}: Omit<CheckoutPaymentFormProps, "session"> & { sessionId: string | null; sessionKey: string }) {
    const checkoutState = useCheckoutElements()
    const { stage: activeStep, setStage } = useCheckoutStage()
    const params = useParams<{ locale?: string }>()
    const locale = params?.locale === "de" ? "de" : "en"

    const paymentFormId = useId()
    const emailInputId = useId()
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isUpdatingBilling, setIsUpdatingBilling] = useState(false)
    const [isConfirming, setIsConfirming] = useState(false)
    // State updates are not synchronous, so a double click could pass an `isConfirming` check twice.
    const isConfirmingRef = useRef(false)
    const [consentHighlights, setConsentHighlights] = useState<ConsentHighlights>(NO_CONSENT_HIGHLIGHTS)
    const [canRestartCheckout, setCanRestartCheckout] = useState(false)
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
    const [taxIdDraft, setTaxIdDraft] = useState<CheckoutTaxIdDraft | null>(null)
    // The tax ID is optional; only a partially entered one holds the checkout back.
    const isTaxIdIncomplete = collectTaxId && taxIdDraft !== null && taxIdDraft.visible && !taxIdDraft.empty && !taxIdDraft.complete
    const checkoutErrorMessage = checkoutState.type === "error" ? checkoutState.error.message : null
    const liveStripePricing = checkoutState.type === "success" ? getStripePricingFromSession(checkoutState.checkout) : null
    const restoredBillingRef = useRef(false)
    const editBillingAddressRef = useRef(false)
    const markContactElementLoading = useCallback(() => setIsContactElementReady(false), [])
    const markAddressElementLoading = useCallback(() => setIsAddressElementReady(false), [])
    const markTaxIdElementLoading = useCallback(() => setIsTaxIdElementReady(false), [])
    const markContactElementReady = useCallback(() => setIsContactElementReady(true), [])
    const markAddressElementReady = useCallback((element: StripeAddressElement) => {
        setIsAddressElementReady(true)
        if (editBillingAddressRef.current) {
            editBillingAddressRef.current = false
            element.focus()
        }
    }, [])
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

    const editBillingAddress = () => {
        editBillingAddressRef.current = true
        showBillingAddress()
    }

    const updateCheckoutBilling = useCallback(
        async (moveToPayment: boolean) => {
            if (!billingAddress || !email || !isBillingAddressComplete || !isContactDetailsComplete || isTaxIdIncomplete || checkoutState.type !== "success" || isUpdatingBilling) return

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
            isTaxIdIncomplete,
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

    const stopConfirming = () => {
        isConfirmingRef.current = false
        setIsConfirming(false)
        onPaymentConfirmationChange(false)
    }

    const showConsentError = (error: unknown) => {
        const errorCode = error instanceof CheckoutSubmissionError ? error.errorCode : null
        if (errorCode === "MISSING_CHECKOUT_CONSENT") {
            // Crater decides what this customer must consent to. Point at what is unticked, or at every shown consent
            // when the form considered them complete.
            const unticked = { terms: !acceptedTerms, withdrawal: requiresWithdrawalConsent && !acceptedWithdrawalConsent }
            setConsentHighlights(unticked.terms || unticked.withdrawal ? unticked : { terms: true, withdrawal: requiresWithdrawalConsent })
            setErrorMessage(errors.checkoutConsentMissing)
            return
        }
        if (errorCode === "INVALID_CHECKOUT_CONSENT_SESSION") {
            setErrorMessage(errors.checkoutConsentSession)
            setCanRestartCheckout(true)
            return
        }
        if (error instanceof CheckoutSubmissionError && error.status === 429) {
            setErrorMessage(errors.checkoutRateLimit)
            return
        }
        console.error("Failed to record the checkout consents:", error instanceof CheckoutSubmissionError ? (error.errorCode ?? error.status) : error)
        setErrorMessage(errors.checkoutConsentRecord)
    }

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (checkoutState.type !== "success" || isConfirmingRef.current || !isPaymentElementReady || !hasRequiredConsents || isTaxIdIncomplete) return

        isConfirmingRef.current = true
        setIsConfirming(true)
        onPaymentConfirmationChange(true)
        setErrorMessage(null)
        setConsentHighlights(NO_CONSENT_HIGHLIGHTS)
        setCanRestartCheckout(false)
        if (!billingAddress) {
            stopConfirming()
            setErrorMessage(errors.billingAddressUpdate)
            return
        }
        if (!sessionId) {
            stopConfirming()
            setErrorMessage(errors.checkoutConsentSession)
            setCanRestartCheckout(true)
            return
        }

        // The consent must be stored for this session before Stripe confirms; Crater refunds a checkout without one.
        try {
            await recordCheckoutConsent({ sessionId, consents: { terms: acceptedTerms, ...(requiresWithdrawalConsent ? { withdrawal: acceptedWithdrawalConsent } : {}) } })
        } catch (error) {
            stopConfirming()
            showConsentError(error)
            return
        }

        try {
            const result = await checkoutState.checkout.confirm({ redirect: "always" })

            if (result.type === "error") {
                stopConfirming()
                if (isInactiveCheckoutSessionError(result.error.message)) {
                    await onSessionExpired()
                    return
                }
                setErrorMessage(errors.paymentConfirmation)
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : ""
            stopConfirming()
            if (isInactiveCheckoutSessionError(message)) {
                await onSessionExpired()
                return
            }
            console.error("Failed to confirm the Stripe checkout payment:", error)
            setErrorMessage(errors.paymentConfirmation)
        }
    }

    const restartCheckout = () => {
        setCanRestartCheckout(false)
        setErrorMessage(null)
        void onRestartCheckout()
    }

    const setTermsConsent = useCallback((accepted: boolean) => {
        setAcceptedTerms(accepted)
        setConsentHighlights((highlights) => ({ ...highlights, terms: false }))
    }, [])
    const setWithdrawalConsent = useCallback((accepted: boolean) => {
        setAcceptedWithdrawalConsent(accepted)
        setConsentHighlights((highlights) => ({ ...highlights, withdrawal: false }))
    }, [])

    // A load error keeps the placeholder too: the session is recovered or replaced by an error message above.
    if (checkoutState.type !== "success") {
        return (
            <CheckoutFormSkeleton
                billingAddress={billingAddress}
                collectTaxId={collectTaxId}
                content={content}
                customerEmail={customerEmail}
                isBusinessCustomer={isBusinessCustomer}
                stage={activeStep}
            />
        )
    }

    return (
        <CheckoutStageTransition
            stage={activeStep}
            billing={
                <>
                    <section className="w-full space-y-4">
                        <h3 className="text-lg text-white">{content.contactHeading}</h3>
                        {customerEmail ? (
                            <div className="checkout-locked-input w-full [&_.input-wrapper]:w-full!">
                                <CheckoutFieldLabel htmlFor={emailInputId}>{content.emailLabel}</CheckoutFieldLabel>
                                <EmailInput id={emailInputId} value={customerEmail} disabled />
                            </div>
                        ) : activeStep === "billingAddress" ? (
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
                        ) : null}
                    </section>

                    <section className="w-full space-y-4">
                        <h3 className="text-lg text-white">{content.billingHeading}</h3>
                        <StripeElementSlot heightKey={collectTaxId ? "billingAddressWithTaxId" : "billingAddress"} ready={isAddressElementReady && isTaxIdElementReady}>
                            <div className="space-y-4">
                                {/* The address and contact details are set through updateBillingAddress and updateEmail, which
                                    Stripe refuses to combine with their elements still mounted on confirm, so only the Tax ID
                                    Element stays mounted on the payment step. Stripe refills the others from the session. */}
                                {activeStep === "billingAddress" && (
                                    <BillingAddressElement
                                        // Business customers enter their company name here instead of a person's name.
                                        options={{ display: { name: isBusinessCustomer ? "organization" : "full" } }}
                                        onChange={(event) => {
                                            setIsBillingAddressComplete(event.complete)
                                            onAddressChange({ name: event.value.name, address: event.value.address }, event.complete)
                                        }}
                                        onLoaderStart={markAddressElementLoading}
                                        onReady={markAddressElementReady}
                                    />
                                )}
                                {collectTaxId && (
                                    <TaxIdElement
                                        options={{ fields: { businessName: "never" }, visibility: "always", validation: { taxId: { required: "never" } } }}
                                        onChange={(event) => setTaxIdDraft({ complete: event.complete, empty: event.empty, value: event.value, visible: event.visible })}
                                        onLoaderStart={markTaxIdElementLoading}
                                        onReady={markTaxIdElementReady}
                                    />
                                )}
                            </div>
                        </StripeElementSlot>
                    </section>

                    {activeStep === "billingAddress" && errorMessage && <Alert color="error">{errorMessage}</Alert>}

                    <div className="space-y-3">
                        <Button
                            type="button"
                            variant="normal"
                            disabled={!billingAddress || !email || !isBillingAddressComplete || !isContactDetailsComplete || isTaxIdIncomplete || isUpdatingBilling}
                            onClick={() => void showPayment()}
                            className="h-12! w-full! whitespace-nowrap lg:h-10! bg-white! px-8! text-sm! text-primary! ring-1! ring-white/20! hover:bg-white/90!"
                        >
                            {isUpdatingBilling ? <ButtonLoader label={content.processingLabel} /> : content.continueLabel}
                        </Button>
                        <p className="text-center text-sm text-tertiary">{content.notChargedYetText}</p>
                        {isBusinessCustomer && <SendOfferDialog content={content} emailLocked={offerEmailLocked} initialEmail={email} onSend={onSendOffer} />}
                    </div>
                </>
            }
            payment={
                <>
                    {/* Desktop only: on phones the order card above the form leads back to billing. */}
                    <button
                        type="button"
                        disabled={isConfirming}
                        onClick={showBillingAddress}
                        className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-tertiary transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60 max-lg:hidden"
                    >
                        <IconArrowLeft aria-hidden="true" size={16} />
                        {content.backToBillingLabel}
                    </button>

                    {billingAddress && (
                        <CheckoutBillingSummary
                            billingAddress={billingAddress}
                            taxId={collectTaxId ? (taxIdDraft ? taxIdDraft.value.taxId : checkoutState.checkout.taxIdInfo?.taxId.value) : null}
                            changeLabel={content.billingChangeLabel}
                            disabled={isConfirming}
                            onChange={editBillingAddress}
                        />
                    )}

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

                    {errorMessage && (
                        <Alert color="error">
                            <div className="space-y-2">
                                <p>{errorMessage}</p>
                                {canRestartCheckout && (
                                    <button
                                        type="button"
                                        disabled={isConfirming}
                                        onClick={restartCheckout}
                                        className="cursor-pointer font-medium text-white underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {errors.checkoutRestart}
                                    </button>
                                )}
                            </div>
                        </Alert>
                    )}

                    <div className="space-y-3">
                        <AcceptTermsCheckbox locale={locale} initialValue={false} disabled={isConfirming} formValidation={{ setValue: setTermsConsent, valid: !consentHighlights.terms }} />
                        {requiresWithdrawalConsent && (
                            <WithdrawalConsentCheckbox
                                text={content.withdrawalConsentText}
                                disabled={isConfirming}
                                formValidation={{ setValue: setWithdrawalConsent, valid: !consentHighlights.withdrawal }}
                            />
                        )}
                        <Button
                            type="submit"
                            form={paymentFormId}
                            variant="normal"
                            disabled={isConfirming || isUpdatingBilling || !isPaymentElementReady || !isPaymentDetailsComplete || !hasRequiredConsents || isTaxIdIncomplete}
                            className="h-12! w-full! whitespace-nowrap lg:h-10! bg-white! px-8! text-sm! text-primary! ring-1! ring-white/20! hover:bg-white/90!"
                        >
                            {isConfirming ? <ButtonLoader label={content.processingLabel} /> : content.payNowLabel}
                        </Button>
                        <p className="flex items-center justify-center gap-1.5 text-center text-sm text-tertiary">
                            <IconLock aria-hidden="true" size={16} className="shrink-0" />
                            {content.securePaymentText}
                        </p>
                    </div>
                </>
            }
        />
    )
}
