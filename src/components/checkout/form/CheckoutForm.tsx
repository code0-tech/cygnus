"use client"

import { CheckoutCustomerSelect } from "./CheckoutCustomerSelect"
import { CheckoutFormProvider, useCheckoutFormState } from "@/components/checkout/form/CheckoutFormProvider"
import { CheckoutErrorState } from "@/components/checkout/form/CheckoutErrorState"
import { CheckoutPaymentForm } from "@/components/checkout/form/CheckoutPaymentForm"
import { SendOfferDialog } from "@/components/checkout/shared/SendOfferDialog"
import { useCheckoutStage } from "@/components/checkout/state/CheckoutStageProvider"
import type { CheckoutData, ErrorsContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { stripeAppearance } from "@/lib/stripeAppearance"
import { useStripePromise } from "@/components/providers/StripeProvider"
import { Elements } from "@stripe/react-stripe-js"
import { useRef } from "react"
import { CheckoutFormSkeleton } from "./CheckoutFormSkeleton"
import { CheckoutNewCustomerForm } from "./CheckoutNewCustomerForm"

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
        refreshExpiredCheckoutSession,
        resolvedError,
        selectedCustomerId,
        selectCheckoutCustomer,
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
    const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId)
    const showCustomerSelect = stage === "billingAddress" && Boolean(hasExistingCustomers) && customers.length > 0
    const customerSelect = showCustomerSelect ? (
        <CheckoutCustomerSelect content={content} customers={customers} selectedCustomer={selectedCustomer} onValueChange={(value) => void selectCheckoutCustomer(value)} />
    ) : null
    // The real select, disabled, keeps the placeholder at the exact height. It only appears once customers are known.
    const customerSelectSkeleton = showCustomerSelect ? (
        <div data-testid="checkout-customer-select-skeleton" className="animate-pulse motion-reduce:animate-none">
            <CheckoutCustomerSelect content={content} customers={customers} disabled selectedCustomer={selectedCustomer} onValueChange={() => {}} />
        </div>
    ) : null
    const customerEmail = guestEmail ?? selectedCustomer?.email ?? null
    const defaultBillingAddressValues = useRef(
        stripeBillingAddress
            ? {
                  name: stripeBillingAddress.name,
                  address: stripeBillingAddress.address,
              }
            : undefined
    )

    if (resolvedError) return <CheckoutErrorState message={resolvedError} onRetry={retryCheckout} retryLabel={errors.retry} />

    const checkoutContent = checkoutSession ? (
        <CheckoutPaymentForm
            billingAddress={stripeBillingAddress}
            billingAddressComplete={stripeBillingAddressComplete}
            collectTaxId={customerType === "business"}
            content={content}
            errors={errors}
            customerSelect={customerSelect}
            customerSelectSkeleton={customerSelectSkeleton}
            customerEmail={customerEmail}
            email={stripeEmail}
            emailComplete={stripeEmailComplete}
            emailSyncedToStripe={stripeEmailSynced}
            isBusinessCustomer={customerType === "business"}
            offerEmailLocked={Boolean(guestEmail)}
            onAddressChange={setStripeBillingAddress}
            onEmailChange={setStripeEmail}
            onEmailSyncedChange={setStripeEmailSynced}
            onTaxQuoteChange={setTaxQuote}
            onPaymentConfirmationChange={setIsConfirmingPayment}
            onPricingChange={setStripePricing}
            onSendOffer={sendOffer}
            onStripeCheckoutChange={setStripeCheckout}
            onSessionExpired={refreshExpiredCheckoutSession}
            onSessionLoadError={recoverCheckoutSessionLoad}
            onSessionLoadErrorChange={setStripeSessionError}
            onSessionReady={markCheckoutSessionReady}
            session={checkoutSession}
        />
    ) : (!isLoading || isCreatingCustomer) && !isRefreshingSession && !isSessionLoading ? (
        !stripePromise ? (
            <CheckoutErrorState message="Stripe is not configured." />
        ) : (
            <Elements stripe={stripePromise} options={{ appearance: stripeAppearance }}>
                <CheckoutNewCustomerForm
                    customerSelect={customerSelect}
                    defaultBillingAddress={defaultBillingAddressValues.current}
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
            customerSelect={customerSelectSkeleton}
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
