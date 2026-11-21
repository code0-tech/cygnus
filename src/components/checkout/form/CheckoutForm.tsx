"use client"

import { CheckoutFormProvider, useCheckoutFormState } from "@/components/checkout/form/CheckoutFormProvider"
import { CheckoutErrorState } from "@/components/checkout/form/CheckoutErrorState"
import { CheckoutPaymentForm } from "@/components/checkout/form/CheckoutPaymentForm"
import { SendOfferDialog } from "@/components/checkout/shared/SendOfferDialog"
import { useCheckoutStage } from "@/components/checkout/state/CheckoutStageProvider"
import type { CheckoutStripePricingData } from "@/lib/checkout/client"
import type { CheckoutData, ErrorsContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { stripeAppearance } from "@/lib/stripeAppearance"
import { useStripePromise } from "@/components/providers/StripeProvider"
import { Elements } from "@stripe/react-stripe-js"
import { useCallback } from "react"
import { CheckoutFormSkeleton } from "./CheckoutFormSkeleton"
import { CheckoutNewCustomerForm } from "./CheckoutNewCustomerForm"
import type { CheckoutPaymentFormProps } from "./checkoutPayment.types"
import { useSessionSwap } from "./useSessionSwap"

const noop = () => {}
const resolveFalse = () => Promise.resolve(false)

// The outgoing form stays visible while its replacement loads, but must not write into the shared checkout state.
const RETIRING_FORM_CALLBACKS = {
    onAddressChange: noop,
    onEmailChange: noop,
    onEmailSyncedChange: noop,
    onPaymentConfirmationChange: noop,
    onPricingChange: noop,
    onSendOffer: () => Promise.resolve(),
    onRestartCheckout: resolveFalse,
    onSessionExpired: resolveFalse,
    onSessionLoadError: resolveFalse,
    onSessionLoadErrorChange: noop,
    onSessionReady: noop,
    onStripeCheckoutChange: noop,
    onTaxQuoteChange: noop,
} satisfies Partial<CheckoutPaymentFormProps>

function CheckoutFormContent() {
    const stripePromise = useStripePromise("checkout")
    const { stage } = useCheckoutStage()
    const {
        canSendOffer,
        checkoutSession,
        continueNewCustomer,
        content,
        customers,
        customerType,
        errors,
        hasExistingCustomers,
        guestEmail,
        isCreatingCustomer,
        isLoading,
        isRefreshingSession,
        isSessionLoading,
        markCheckoutSessionReady,
        retryCheckout,
        setStripeCheckout,
        recoverCheckoutSessionLoad,
        refreshCheckoutSession,
        refreshExpiredCheckoutSession,
        resolvedError,
        selectedCustomerId,
        sendOffer,
        setStripeBillingAddress,
        setStripeEmail,
        setStripeEmailSynced,
        setStripePricing,
        setStripeSessionError,
        setTaxQuote,
        setIsConfirmingPayment,
        stripeBillingAddress,
        stripeBillingAddressComplete,
        stripeEmail,
        stripeEmailComplete,
        stripeEmailSynced,
    } = useCheckoutFormState()
    const { finishSwap, retiringSession } = useSessionSwap(checkoutSession)
    const isSwappingSession = Boolean(retiringSession)
    const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId)
    const customerEmail = guestEmail ?? selectedCustomer?.email ?? null

    const handleSessionReady = useCallback(() => {
        markCheckoutSessionReady()
        finishSwap()
    }, [finishSwap, markCheckoutSessionReady])
    const handlePricingChange = useCallback(
        (pricing: CheckoutStripePricingData | null) => {
            if (pricing || !isSwappingSession) setStripePricing(pricing)
        },
        [isSwappingSession, setStripePricing]
    )

    if (resolvedError) return <CheckoutErrorState message={resolvedError} onRetry={retryCheckout} retryLabel={errors.retry} />

    const paymentFormProps = {
        billingAddress: stripeBillingAddress,
        billingAddressComplete: stripeBillingAddressComplete,
        collectTaxId: customerType === "business",
        content,
        errors,
        customerEmail,
        customerId: selectedCustomerId,
        email: stripeEmail,
        emailComplete: stripeEmailComplete,
        emailSyncedToStripe: stripeEmailSynced,
        isBusinessCustomer: customerType === "business",
        offerEmailLocked: Boolean(guestEmail),
    }

    const checkoutContent = checkoutSession ? (
        <div className="relative">
            {retiringSession && (
                <div key={retiringSession.clientSecret} aria-hidden="true" inert className="opacity-50 transition-opacity">
                    <CheckoutPaymentForm {...paymentFormProps} {...RETIRING_FORM_CALLBACKS} session={retiringSession} />
                </div>
            )}
            <div
                key={checkoutSession.clientSecret}
                aria-busy={isRefreshingSession || isSwappingSession}
                inert={isRefreshingSession || isSwappingSession}
                className={isSwappingSession ? "invisible absolute inset-x-0 top-0" : isRefreshingSession ? "opacity-50 transition-opacity" : "transition-opacity"}
            >
                <CheckoutPaymentForm
                    {...paymentFormProps}
                    onAddressChange={setStripeBillingAddress}
                    onEmailChange={setStripeEmail}
                    onEmailSyncedChange={setStripeEmailSynced}
                    onTaxQuoteChange={setTaxQuote}
                    onPaymentConfirmationChange={setIsConfirmingPayment}
                    onPricingChange={handlePricingChange}
                    onSendOffer={sendOffer}
                    onStripeCheckoutChange={setStripeCheckout}
                    onRestartCheckout={refreshCheckoutSession}
                    onSessionExpired={refreshExpiredCheckoutSession}
                    onSessionLoadError={recoverCheckoutSessionLoad}
                    onSessionLoadErrorChange={setStripeSessionError}
                    onSessionReady={handleSessionReady}
                    session={checkoutSession}
                />
            </div>
        </div>
    ) : (!isLoading || isCreatingCustomer) && !isRefreshingSession && !isSessionLoading ? (
        !stripePromise ? (
            <CheckoutErrorState message="Stripe is not configured." />
        ) : (
            <Elements stripe={stripePromise} options={{ appearance: stripeAppearance }}>
                <CheckoutNewCustomerForm
                    onSubmit={() => void continueNewCustomer()}
                    sendOffer={
                        customerType === "business" ? (
                            <SendOfferDialog
                                content={content}
                                blockedReason={canSendOffer ? null : content.sendOfferBillingRequired}
                                emailLocked={Boolean(guestEmail)}
                                initialEmail={guestEmail ?? stripeEmail}
                                onSend={sendOffer}
                            />
                        ) : null
                    }
                />
            </Elements>
        )
    ) : (
        <CheckoutFormSkeleton
            billingAddress={stripeBillingAddress}
            collectTaxId={customerType === "business" && hasExistingCustomers === true}
            content={content}
            customerEmail={customerEmail}
            isBusinessCustomer={customerType === "business"}
            stage={stage}
        />
    )

    return <div className="w-full">{checkoutContent}</div>
}

interface CheckoutFormProps {
    content?: CheckoutData["form"] | null
    errors?: ErrorsContent | null
    locale?: AppLocale
}

export function CheckoutForm({ content, errors, locale }: CheckoutFormProps) {
    const form = <CheckoutFormContent />
    return content && errors && locale ? (
        <CheckoutFormProvider content={content} errors={errors} locale={locale}>
            {form}
        </CheckoutFormProvider>
    ) : (
        form
    )
}
