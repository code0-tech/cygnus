"use client"

import type { CheckoutData } from "@/lib/cms"
import type { CheckoutSessionData, CheckoutTaxQuoteData } from "@/lib/checkout/checkoutSubmission"
import { useCheckoutStage } from "@/components/checkout/CheckoutStepper"
import { ButtonLoader } from "@/components/ui/Loader"
import { Button } from "@code0-tech/pictor"
import { IconAlertTriangle } from "@tabler/icons-react"
import { BillingAddressElement, CheckoutElementsProvider, ContactDetailsElement, PaymentElement, TaxIdElement, useCheckoutElements } from "@stripe/react-stripe-js/checkout"
import { loadStripe, type StripeCheckoutContact, type StripeCheckoutElementsSdkOptions, type StripeCheckoutSession } from "@stripe/stripe-js"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type CheckoutFormContent = CheckoutData["form"]

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey, { betas: ["custom_checkout_tax_id_1"], locale: "en" }) : null
const stripeAppearance = {
    theme: "night",
    labels: "above",
    variables: {
        colorPrimary: "#72f896",
        colorBackground: "#201e2c",
        colorText: "#ffffff",
        colorTextSecondary: "rgba(255, 255, 255, 0.5)",
        colorTextPlaceholder: "rgba(255, 255, 255, 0.35)",
        colorDanger: "#ef5b68",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        fontSizeBase: "13px",
        fontWeightNormal: "400",
        fontWeightMedium: "400",
        spacingUnit: "4px",
        gridRowSpacing: "16px",
        borderRadius: "16px",
        focusBoxShadow: "none",
        focusOutline: "none",
        inputBoxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
        inputFocusBoxShadow: "none",
        inputFocusColorBorder: "transparent",
        labelColorText: "rgba(255, 255, 255, 0.5)",
        labelFontSize: "11px",
        labelFontWeight: "400",
        labelSpacing: "7px",
    },
    rules: {
        ".Input": {
            backgroundColor: "#272532",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
            padding: "11px",
            letterSpacing: "-0.5px",
        },
        ".Input:hover": {
            backgroundColor: "rgba(191, 191, 191, 0.15)",
        },
        ".Input:focus": {
            backgroundColor: "rgba(191, 191, 191, 0.15)",
            border: "none",
            boxShadow: "none",
            outline: "none",
        },
        ".Input--invalid": {
            backgroundColor: "#1c0516",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(217, 4, 41, 0.1)",
        },
        ".Dropdown": {
            backgroundColor: "#191825",
            border: "none",
            borderRadius: "16px",
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 12px 32px rgba(0, 0, 0, 0.35)",
        },
        ".DropdownItem": {
            backgroundColor: "transparent",
            borderRadius: "10px",
            color: "rgba(255, 255, 255, 0.75)",
            fontSize: "13px",
            margin: "4px",
            padding: "10px 12px",
        },
        ".DropdownItem--highlight": {
            backgroundColor: "#201e2c",
            color: "#ffffff",
        },
        ".DropdownItem:active": {
            backgroundColor: "rgba(191, 191, 191, 0.2)",
            color: "#ffffff",
        },
        ".DropdownItem:focus": {
            backgroundColor: "#201e2c",
            color: "#ffffff",
            outline: "none",
        },
        ".Label": {
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: "11px",
            fontWeight: "400",
            letterSpacing: "-0.5px",
            textTransform: "uppercase",
        },
        ".Tab": {
            backgroundColor: "#191825",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
        },
        ".Tab:hover": {
            backgroundColor: "#201e2c",
        },
        ".Tab--selected": {
            backgroundColor: "#201e2c",
            border: "none",
            boxShadow: "none",
        },
        ".Tab:focus": {
            backgroundColor: "#2b2938",
            boxShadow: "none",
            outline: "none",
        },
        ".AccordionItem": {
            backgroundColor: "#191825",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
        },
        ".AccordionItem:hover": {
            backgroundColor: "#201e2c",
        },
        ".AccordionItem--selected": {
            backgroundColor: "#201e2c",
            border: "none",
            boxShadow: "none",
        },
        ".AccordionItem:focus-visible": {
            backgroundColor: "#2b2938",
            boxShadow: "none",
            outline: "none",
        },
    },
} satisfies NonNullable<NonNullable<StripeCheckoutElementsSdkOptions["elementsOptions"]>["appearance"]>

interface CheckoutPaymentFormProps {
    billingAddress: StripeCheckoutContact | null
    collectTaxId: boolean
    content: CheckoutFormContent
    email: string | null
    onAddressChange: (address: StripeCheckoutContact | null) => void
    onEmailChange: (email: string | null) => void
    onTaxQuoteChange: (taxQuote: CheckoutTaxQuoteData | null) => void
    onPaymentConfirmationChange: (confirming: boolean) => void
    onSessionExpired: () => Promise<void>
    onSessionLoadErrorChange: (error: string | null) => void
    onSessionReady: () => void
    session: CheckoutSessionData
}

export function CheckoutErrorState({ message }: { message: string }) {
    return (
        <div
            role="alert"
            aria-live="assertive"
            className="flex w-full items-center gap-2 rounded-2xl border border-error/30 bg-error/10 p-4 text-error shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_12px_32px_rgba(0,0,0,0.18)]"
        >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-error/15 ring-1 ring-error/20">
                <IconAlertTriangle aria-hidden="true" size={21} stroke={1.8} />
            </span>
            <p className="min-w-0 text-base font-medium leading-6 text-error">{message}</p>
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

function getTaxQuoteFromSession(session: StripeCheckoutSession): CheckoutTaxQuoteData | null {
    if (session.tax?.status !== "ready" || !session.total?.total || !session.total.taxExclusive) return null

    return {
        amountTotal: session.total.total.minorUnitsAmount,
        currency: session.currency,
        taxAmountExclusive: session.total.taxExclusive.minorUnitsAmount,
    }
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

function CheckoutPaymentFields({
    billingAddress,
    collectTaxId,
    content,
    email,
    onAddressChange,
    onEmailChange,
    onTaxQuoteChange,
    onPaymentConfirmationChange,
    onSessionExpired,
    onSessionLoadErrorChange,
    onSessionReady,
}: Omit<CheckoutPaymentFormProps, "session">) {
    const checkoutState = useCheckoutElements()
    const { stage: activeStep, setStage } = useCheckoutStage()
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isUpdatingBilling, setIsUpdatingBilling] = useState(false)
    const [isConfirming, setIsConfirming] = useState(false)
    const [isPaymentElementReady, setIsPaymentElementReady] = useState(false)
    const checkoutErrorMessage = checkoutState.type === "error" ? checkoutState.error.message : null
    const restoredBillingRef = useRef(false)

    useEffect(() => {
        if (checkoutState.type === "success") {
            onSessionLoadErrorChange(null)
            onSessionReady()
            return
        }

        if (!checkoutErrorMessage) return
        if (isInactiveCheckoutSessionError(checkoutErrorMessage)) {
            onSessionLoadErrorChange(null)
            void onSessionExpired()
            return
        }

        onSessionLoadErrorChange(content.errors.checkoutSession)
    }, [checkoutErrorMessage, checkoutState.type, content.errors.checkoutSession, onSessionExpired, onSessionLoadErrorChange, onSessionReady])

    const showBillingAddress = () => {
        setStage("billingAddress")
        setErrorMessage(null)
    }

    const updateCheckoutBilling = useCallback(
        async (moveToPayment: boolean) => {
            if (!billingAddress || !email || checkoutState.type !== "success" || isUpdatingBilling) return

            setIsUpdatingBilling(true)
            setErrorMessage(null)
            try {
                const billingResult = await checkoutState.checkout.updateBillingAddress(billingAddress)
                if (billingResult.type === "error") {
                    setErrorMessage(content.errors.billingAddressUpdate)
                    return
                }
                let updatedSession = billingResult.session

                if (!checkoutState.checkout.email) {
                    const emailResult = await checkoutState.checkout.updateEmail(email)
                    if (emailResult.type === "error") {
                        setErrorMessage(content.errors.emailUpdate)
                        return
                    }
                    updatedSession = emailResult.session
                }

                onTaxQuoteChange(getTaxQuoteFromSession(updatedSession))
                restoredBillingRef.current = true
                setIsPaymentElementReady(false)
                if (moveToPayment) setStage("payment")
            } catch (error) {
                console.error("Failed to update Stripe checkout billing details:", error)
                setErrorMessage(content.paymentErrorFallback)
            } finally {
                setIsUpdatingBilling(false)
            }
        },
        [billingAddress, checkoutState, content.errors.billingAddressUpdate, content.errors.emailUpdate, content.paymentErrorFallback, email, isUpdatingBilling, onTaxQuoteChange, setStage]
    )

    const showPayment = () => updateCheckoutBilling(true)

    useEffect(() => {
        if (activeStep !== "payment" || checkoutState.type !== "success" || !billingAddress || !email || restoredBillingRef.current) return

        restoredBillingRef.current = true
        void updateCheckoutBilling(false)
    }, [activeStep, billingAddress, checkoutState.type, email, updateCheckoutBilling])

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
                setErrorMessage(content.errors.billingAddressUpdate)
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
                setErrorMessage(content.errors.paymentConfirmation)
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
            setErrorMessage(content.errors.paymentConfirmation)
        }
    }

    if (checkoutState.type === "loading") {
        return <CheckoutPaymentFormSkeleton label={content.processingLabel} />
    }

    if (checkoutState.type === "error") {
        const message = isInactiveCheckoutSessionError(checkoutState.error.message) ? content.errors.checkoutSessionExpired : content.errors.checkoutSession
        return <CheckoutErrorState message={message} />
    }

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-6">
            {activeStep === "billingAddress" ? (
                <>
                    <section className="w-full space-y-4">
                        <ContactDetailsElement onChange={(event) => onEmailChange(event.complete ? event.value.email : null)} />
                        <BillingAddressElement
                            options={{ display: { name: "full" } }}
                            onChange={(event) => onAddressChange(event.complete ? { name: event.value.name, address: event.value.address } : null)}
                        />
                        {collectTaxId && <TaxIdElement options={{ fields: { businessName: "never" }, visibility: "auto" }} />}
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
                            disabled={!billingAddress || !email || isUpdatingBilling}
                            onClick={() => void showPayment()}
                            className="h-10! w-full! whitespace-nowrap bg-white/80! px-8! text-sm! text-primary! ring-1! ring-white/20! hover:bg-white!"
                        >
                            {isUpdatingBilling ? <ButtonLoader label={content.processingLabel} /> : content.continueLabel}
                        </Button>
                    </div>
                </>
            ) : (
                <>
                    <section className="w-full space-y-4">
                        <PaymentElement
                            options={{ fields: { billingDetails: { name: "never", address: "never" } } }}
                            onLoaderStart={() => setIsPaymentElementReady(false)}
                            onReady={() => setIsPaymentElementReady(true)}
                        />
                    </section>

                    {errorMessage && (
                        <p className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error" role="alert">
                            {errorMessage}
                        </p>
                    )}

                    <div className="space-y-3">
                        <Button
                            type="submit"
                            variant="normal"
                            disabled={isConfirming || isUpdatingBilling || !isPaymentElementReady}
                            className="h-10! w-full! whitespace-nowrap bg-white/80! px-8! text-sm! text-primary! ring-1! ring-white/20! hover:bg-white!"
                        >
                            {isConfirming ? <ButtonLoader label={content.processingLabel} /> : content.payNowLabel}
                        </Button>
                        <Button
                            type="button"
                            variant="normal"
                            disabled={isConfirming}
                            onClick={showBillingAddress}
                            className="h-10! w-full! border-white/10! bg-white/3! text-sm! text-secondary! hover:bg-white/6! hover:text-white!"
                        >
                            {content.backToBillingLabel}
                        </Button>
                    </div>
                </>
            )}
        </form>
    )
}

export function CheckoutPaymentForm({
    billingAddress,
    collectTaxId,
    content,
    email,
    onAddressChange,
    onEmailChange,
    onTaxQuoteChange,
    onPaymentConfirmationChange,
    onSessionExpired,
    onSessionLoadErrorChange,
    onSessionReady,
    session,
}: CheckoutPaymentFormProps) {
    const stripeRef = useRef(stripePromise)
    const defaultValuesRef = useRef<{
        clientSecret: string
        values: NonNullable<StripeCheckoutElementsSdkOptions["defaultValues"]>
    } | null>(null)

    if (defaultValuesRef.current?.clientSecret !== session.clientSecret) {
        defaultValuesRef.current = {
            clientSecret: session.clientSecret,
            values: {
                ...(billingAddress ? { billingAddress } : {}),
                ...(email ? { email } : {}),
            },
        }
    }

    const options = useMemo<StripeCheckoutElementsSdkOptions>(
        () => ({
            clientSecret: session.clientSecret,
            ...(Object.keys(defaultValuesRef.current?.values ?? {}).length ? { defaultValues: defaultValuesRef.current?.values } : {}),
            elementsOptions: { appearance: stripeAppearance },
        }),
        [session.clientSecret]
    )

    if (!stripeRef.current) {
        return <CheckoutErrorState message="Stripe is not configured." />
    }

    return (
        <CheckoutElementsProvider key={session.clientSecret} stripe={stripeRef.current} options={options}>
            <CheckoutPaymentFields
                billingAddress={billingAddress}
                collectTaxId={collectTaxId}
                content={content}
                email={email}
                onAddressChange={onAddressChange}
                onEmailChange={onEmailChange}
                onTaxQuoteChange={onTaxQuoteChange}
                onPaymentConfirmationChange={onPaymentConfirmationChange}
                onSessionExpired={onSessionExpired}
                onSessionLoadErrorChange={onSessionLoadErrorChange}
                onSessionReady={onSessionReady}
            />
        </CheckoutElementsProvider>
    )
}
