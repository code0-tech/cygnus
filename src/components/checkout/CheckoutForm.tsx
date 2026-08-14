"use client"

import { CheckoutFormProvider, useCheckoutFormState } from "@/components/checkout/CheckoutFormProvider"
import { CheckoutErrorState, CheckoutPaymentForm, CheckoutPaymentFormSkeleton } from "@/components/checkout/CheckoutPaymentForm"
import { useCheckoutStage } from "@/components/checkout/CheckoutStepper"
import type { CheckoutData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { SelectContent, SelectInput, SelectItem, SelectItemText, SelectPortal, SelectTrigger, SelectValue, SelectViewport } from "@code0-tech/pictor"
import { IconChevronDown, IconPlus } from "@tabler/icons-react"

const NEW_CUSTOMER_VALUE = "new"

function CheckoutCustomerSelectSkeleton() {
    return (
        <div aria-hidden="true" data-testid="checkout-customer-select-skeleton" className="w-full animate-pulse motion-reduce:animate-none">
            <div className="mb-2 h-2.5 w-24 rounded-full bg-white/10" />
            <div className="h-10 w-full rounded-2xl bg-white/[0.07] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]" />
        </div>
    )
}

function CheckoutFormContent() {
    const { stage } = useCheckoutStage()
    const {
        checkoutSession,
        content,
        customers,
        customerType,
        errorMessage,
        hasExistingCustomers,
        isLoading,
        isRefreshingSession,
        isSessionLoading,
        markCheckoutSessionReady,
        refreshExpiredCheckoutSession,
        selectedCustomerId,
        selectCheckoutCustomer,
        sessionError,
        setStripeBillingAddress,
        setStripeEmail,
        setStripeSessionError,
        setTaxQuote,
        setIsConfirmingPayment,
        stripeBillingAddress,
        stripeEmail,
        stripeSessionError,
    } = useCheckoutFormState()
    const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId)
    const resolvedError = errorMessage ?? sessionError ?? stripeSessionError

    if (resolvedError) {
        return <CheckoutErrorState message={resolvedError} />
    }

    let checkoutContent

    if (checkoutSession) {
        checkoutContent = (
            <CheckoutPaymentForm
                billingAddress={stripeBillingAddress}
                collectTaxId={customerType === "business"}
                content={content}
                email={stripeEmail}
                onAddressChange={setStripeBillingAddress}
                onEmailChange={setStripeEmail}
                onTaxQuoteChange={setTaxQuote}
                onPaymentConfirmationChange={setIsConfirmingPayment}
                onSessionExpired={refreshExpiredCheckoutSession}
                onSessionLoadErrorChange={setStripeSessionError}
                onSessionReady={markCheckoutSessionReady}
                session={checkoutSession}
            />
        )
    } else {
        if (isLoading || isRefreshingSession || isSessionLoading) {
            checkoutContent = <CheckoutPaymentFormSkeleton label={content.processingLabel} />
        } else {
            checkoutContent = <CheckoutPaymentFormSkeleton label={content.processingLabel} />
        }
    }

    return (
        <div className="w-full space-y-6">
            {stage === "billingAddress" &&
                ((isLoading || isRefreshingSession || isSessionLoading) && hasExistingCustomers !== false ? (
                    <CheckoutCustomerSelectSkeleton />
                ) : hasExistingCustomers && selectedCustomerId && customers.length > 0 ? (
                    <div className="[&_.input__label]:leading-none [&_.input-wrapper]:mt-1">
                        <SelectInput
                            title={content.customerSelectLabel}
                            value={selectedCustomer ? selectedCustomerId : NEW_CUSTOMER_VALUE}
                            onValueChange={(value) => void selectCheckoutCustomer(value === NEW_CUSTOMER_VALUE ? null : value)}
                        >
                            <SelectTrigger className="flex h-9! w-full! items-center gap-2 text-left! text-sm! outline-none! ring-0! focus:outline-none! focus:ring-0! focus-visible:outline-none! focus-visible:ring-0!">
                                <SelectValue>{selectedCustomer?.name || selectedCustomer?.email || content.newCustomerLabel}</SelectValue>
                                <IconChevronDown aria-hidden="true" className="ml-auto shrink-0 mr-2" size={16} />
                            </SelectTrigger>
                            <SelectPortal>
                                <SelectContent position="popper" className="z-100 w-(--radix-select-trigger-width)!">
                                    <SelectViewport>
                                        {customers.map((customer) => (
                                            <SelectItem key={customer.id} value={customer.id}>
                                                <SelectItemText>{customer.name || customer.email || content.newCustomerLabel}</SelectItemText>
                                            </SelectItem>
                                        ))}
                                        <SelectItem value={NEW_CUSTOMER_VALUE}>
                                            <SelectItemText>
                                                <span className="flex items-center gap-2 text-brand">
                                                    <IconPlus aria-hidden="true" size={15} />
                                                    {content.newCustomerLabel}
                                                </span>
                                            </SelectItemText>
                                        </SelectItem>
                                    </SelectViewport>
                                </SelectContent>
                            </SelectPortal>
                        </SelectInput>
                    </div>
                ) : null)}
            {checkoutContent}
        </div>
    )
}

interface CheckoutFormProps {
    content?: CheckoutData["form"] | null
    locale?: AppLocale
    mobileSteps?: boolean
}

export function CheckoutForm({ content, locale }: CheckoutFormProps) {
    const form = <CheckoutFormContent />
    return content && locale ? (
        <CheckoutFormProvider content={content} locale={locale}>
            {form}
        </CheckoutFormProvider>
    ) : (
        form
    )
}
