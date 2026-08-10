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
        errorMessage,
        isLoading,
        isRefreshingSession,
        isSessionLoading,
        isStripeAddressComplete,
        isStripeContactComplete,
        retryPreparation,
        sessionError,
        setIsStripeAddressComplete,
        setIsStripeContactComplete,
    } = useCheckoutFormState()

    if (checkoutSession) {
        return (
            <CheckoutPaymentForm
                content={content}
                session={checkoutSession}
                isAddressComplete={isStripeAddressComplete}
                isContactComplete={isStripeContactComplete}
                onAddressComplete={setIsStripeAddressComplete}
                onContactComplete={setIsStripeContactComplete}
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
