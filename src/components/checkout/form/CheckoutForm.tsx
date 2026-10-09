"use client"

import { CheckoutCustomerSelect } from "./CheckoutCustomerSelect"
import { CheckoutFormProvider, useCheckoutFormState } from "@/components/checkout/form/CheckoutFormProvider"
import { CheckoutErrorState, CheckoutPaymentForm, CheckoutPaymentFormSkeleton } from "@/components/checkout/form/CheckoutPaymentForm"
import { SendOfferDialog } from "@/components/checkout/shared/SendOfferDialog"
import { useCheckoutStage } from "@/components/checkout/state/CheckoutStageProvider"
import type { CheckoutData, ErrorsContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { stripeAppearance } from "./stripeCheckout"
import { useStripePromise } from "@/components/providers/StripeProvider"
import { AddressElement, Elements } from "@stripe/react-stripe-js"
import { Button, EmailInput, emailValidation } from "@code0-tech/pictor"
import { useRef } from "react"

function CheckoutCustomerSelectSkeleton() {
    return (
        <div aria-hidden="true" data-testid="checkout-customer-select-skeleton" className="w-full animate-pulse motion-reduce:animate-none">
            <div className="mb-2 h-2.5 w-24 rounded-full bg-white/10" />
            <div className="h-10 w-full rounded-2xl bg-white/[0.07] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]" />
        </div>
    )
}

function CheckoutFormContent() {
    const stripePromise = useStripePromise("checkout")
    const { stage } = useCheckoutStage()
    const {
        checkoutSession,
        continueNewCustomer,
        content,
        customers,
        customerType,
        errors,
        hasExistingCustomers,
        guestEmail,
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
    const customerSelect =
        stage === "billingAddress" && hasExistingCustomers && customers.length > 0 ? (
            <CheckoutCustomerSelect content={content} customers={customers} selectedCustomer={selectedCustomer} onValueChange={(value) => void selectCheckoutCustomer(value)} />
        ) : null
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
            customerSelectSkeleton={customerSelect ? <CheckoutCustomerSelectSkeleton /> : null}
            customerEmail={guestEmail ?? selectedCustomer?.email ?? null}
            email={stripeEmail}
            emailComplete={stripeEmailComplete}
            emailSyncedToStripe={stripeEmailSynced}
            isBusinessCustomer={customerType === "business"}
            onAddressChange={setStripeBillingAddress}
            onEmailChange={setStripeEmail}
            onEmailSyncedChange={setStripeEmailSynced}
            onTaxQuoteChange={setTaxQuote}
            onPaymentConfirmationChange={setIsConfirmingPayment}
            onPricingChange={setStripePricing}
            onStripeCheckoutChange={setStripeCheckout}
            onSessionExpired={refreshExpiredCheckoutSession}
            onSessionLoadError={recoverCheckoutSessionLoad}
            onSessionLoadErrorChange={setStripeSessionError}
            onSessionReady={markCheckoutSessionReady}
            session={checkoutSession}
        />
    ) : !isLoading && !isRefreshingSession && !isSessionLoading ? (
        !stripePromise ? (
            <CheckoutErrorState message="Stripe is not configured." />
        ) : (
            <Elements stripe={stripePromise} options={{ appearance: stripeAppearance }}>
                <form
                    className="w-full space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault()
                        void continueNewCustomer()
                    }}
                >
                    {customerSelect}
                    <EmailInput
                        disabled={Boolean(guestEmail)}
                        title={content.emailLabel}
                        name="email"
                        autoComplete="email"
                        maxLength={254}
                        placeholder={content.emailPlaceholder}
                        value={stripeEmail ?? ""}
                        onChange={(event) => setStripeEmail(event.currentTarget.value, emailValidation(event.currentTarget.value))}
                        className="w-full!"
                    />
                    <AddressElement
                        options={{ mode: "billing", display: { name: "full" }, defaultValues: defaultBillingAddressValues.current }}
                        onChange={(event) => setStripeBillingAddress({ name: event.value.name, address: event.value.address }, event.complete)}
                    />
                    <Button
                        type="submit"
                        variant="normal"
                        disabled={isLoading || !stripeBillingAddressComplete || !stripeEmailComplete}
                        className="h-10! w-full! whitespace-nowrap bg-white/80! px-8! text-sm! text-primary! ring-1! ring-white/20! hover:bg-white!"
                    >
                        {isLoading ? content.processingLabel : content.continueLabel}
                    </Button>
                    {customerType === "business" && <SendOfferDialog content={content} initialEmail={stripeEmail} />}
                </form>
            </Elements>
        )
    ) : (
        <CheckoutPaymentFormSkeleton label={content.processingLabel} />
    )

    return (
        <div className="w-full space-y-4">
            {!checkoutSession && stage === "billingAddress" && (isLoading || isRefreshingSession || isSessionLoading) && hasExistingCustomers !== false ? <CheckoutCustomerSelectSkeleton /> : null}
            {checkoutContent}
        </div>
    )
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
