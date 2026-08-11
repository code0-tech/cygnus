"use client"

import { CheckoutFormProvider, useCheckoutFormState } from "@/components/checkout/CheckoutFormProvider"
import { CheckoutPaymentForm } from "@/components/checkout/CheckoutPaymentForm"
import type { CheckoutData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { Button } from "@code0-tech/pictor"

function CheckoutFormContent() {
    const {
        checkoutSession,
        content,
        customerType,
        errorMessage,
        isLoading,
        isRefreshingSession,
        isSessionLoading,
        retryPreparation,
        sessionError,
        setStripeBillingAddress,
        setStripeEmail,
        setStripeTaxIdType,
        setStripeTaxIdValue,
        stripeBillingAddress,
        stripeEmail,
        stripeTaxIdType,
        stripeTaxIdValue,
    } = useCheckoutFormState()

    if (checkoutSession) {
        return (
            <CheckoutPaymentForm
                billingAddress={stripeBillingAddress}
                collectTaxId={customerType === "business"}
                content={content}
                email={stripeEmail}
                onAddressChange={setStripeBillingAddress}
                onEmailChange={setStripeEmail}
                onTaxIdTypeChange={setStripeTaxIdType}
                onTaxIdValueChange={setStripeTaxIdValue}
                session={checkoutSession}
                taxIdType={stripeTaxIdType}
                taxIdValue={stripeTaxIdValue}
            />
        )
    }

    const resolvedError = errorMessage ?? sessionError
    if (resolvedError) {
        return (
            <div className="space-y-4">
                <p className="text-sm text-error" role="alert">
                    {resolvedError}
                </p>
                <Button type="button" variant="normal" onClick={retryPreparation} className="h-10! w-full! text-sm!">
                    {content.continueLabel}
                </Button>
            </div>
        )
    }

    if (isLoading || isRefreshingSession || isSessionLoading) {
        return <div className="flex min-h-40 items-center justify-center text-sm text-secondary">{content.processingLabel}</div>
    }

    return <div className="flex min-h-40 items-center justify-center text-sm text-secondary">{content.processingLabel}</div>
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
