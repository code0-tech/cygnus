"use client"

import { CheckoutFormProvider, useCheckoutFormState } from "@/components/checkout/CheckoutFormProvider"
import { CheckoutPaymentForm, CheckoutPaymentFormSkeleton } from "@/components/checkout/CheckoutPaymentForm"
import { useCheckoutStage } from "@/components/checkout/CheckoutStepper"
import type { CheckoutData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { Button, SelectContent, SelectInput, SelectItem, SelectItemText, SelectPortal, SelectTrigger, SelectValue, SelectViewport } from "@code0-tech/pictor"
import { IconChevronDown, IconPlus } from "@tabler/icons-react"

const NEW_CUSTOMER_VALUE = "new"

function CheckoutFormContent() {
    const { stage } = useCheckoutStage()
    const {
        checkoutSession,
        content,
        customers,
        customerType,
        errorMessage,
        isLoading,
        isRefreshingSession,
        isSessionLoading,
        markCheckoutSessionReady,
        refreshExpiredCheckoutSession,
        retryPreparation,
        selectedCustomerId,
        selectCheckoutCustomer,
        sessionError,
        setStripeBillingAddress,
        setStripeEmail,
        setStripeTaxIdType,
        setStripeTaxIdValue,
        setTaxQuote,
        setIsConfirmingPayment,
        stripeBillingAddress,
        stripeEmail,
        stripeTaxIdType,
        stripeTaxIdValue,
    } = useCheckoutFormState()

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
                onTaxIdTypeChange={setStripeTaxIdType}
                onTaxIdValueChange={setStripeTaxIdValue}
                onTaxQuoteChange={setTaxQuote}
                onPaymentConfirmationChange={setIsConfirmingPayment}
                onSessionExpired={refreshExpiredCheckoutSession}
                onSessionReady={markCheckoutSessionReady}
                session={checkoutSession}
                taxIdType={stripeTaxIdType}
                taxIdValue={stripeTaxIdValue}
            />
        )
    } else {
        const resolvedError = errorMessage ?? sessionError
        if (resolvedError) {
            checkoutContent = (
            <div className="space-y-4">
                <p className="text-sm text-error" role="alert">
                    {resolvedError}
                </p>
                <Button type="button" variant="normal" onClick={retryPreparation} className="h-10! w-full! text-sm!">
                    {content.continueLabel}
                </Button>
            </div>
        )
        } else if (isLoading || isRefreshingSession || isSessionLoading) {
            checkoutContent = <CheckoutPaymentFormSkeleton label={content.processingLabel} />
        } else {
            checkoutContent = <CheckoutPaymentFormSkeleton label={content.processingLabel} />
        }
    }

    return (
        <div className="w-full space-y-6">
            {stage === "billingAddress" && selectedCustomerId && customers.length > 0 && (
                <SelectInput
                    title={content.customerSelectLabel}
                    value={selectedCustomerId}
                    disabled={isLoading || isRefreshingSession || isSessionLoading}
                    onValueChange={(value) => void selectCheckoutCustomer(value === NEW_CUSTOMER_VALUE ? null : value)}
                    right={<IconChevronDown aria-hidden="true" size={16} />}
                    rightType="icon"
                >
                    <SelectTrigger className="w-full!">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectPortal>
                        <SelectContent position="popper" className="z-100 w-(--radix-select-trigger-width)!">
                            <SelectViewport>
                                {customers.map((customer, index) => (
                                    <SelectItem key={customer.id} value={customer.id}>
                                        <SelectItemText>{customer.name || customer.email || `${content.customerFallbackLabel} ${index + 1}`}</SelectItemText>
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
            )}
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
