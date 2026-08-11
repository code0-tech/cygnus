"use client"

import type { CheckoutData } from "@/lib/cms"
import type { CheckoutSessionData, CheckoutTaxQuoteData } from "@/lib/checkout/checkoutSubmission"
import { useCheckoutStage } from "@/components/checkout/CheckoutStepper"
import { Button, TextInput } from "@code0-tech/pictor"
import { BillingAddressElement, CheckoutElementsProvider, ContactDetailsElement, PaymentElement, useCheckoutElements } from "@stripe/react-stripe-js/checkout"
import { loadStripe, type StripeCheckoutContact, type StripeCheckoutElementsSdkOptions, type StripeCheckoutSession, type StripeCheckoutTaxIdType } from "@stripe/stripe-js"
import { useEffect, useMemo, useRef, useState } from "react"

type CheckoutFormContent = CheckoutData["form"]

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey, { locale: "en" }) : null
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
        inputBoxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
        inputFocusBoxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
        inputFocusColorBorder: "transparent",
        labelColorText: "rgba(255, 255, 255, 0.5)",
        labelFontSize: "11px",
        labelFontWeight: "400",
        labelSpacing: "7px",
    },
    rules: {
        ".Input": {
            backgroundColor: "#201e2c",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
            padding: "11px",
            letterSpacing: "-0.5px",
        },
        ".Input:hover": {
            backgroundColor: "rgba(191, 191, 191, 0.15)",
        },
        ".Input:focus": {
            backgroundColor: "rgba(191, 191, 191, 0.2)",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
        },
        ".Input--invalid": {
            backgroundColor: "#1c0516",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(217, 4, 41, 0.1)",
        },
        ".Label": {
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: "11px",
            fontWeight: "400",
            letterSpacing: "-0.5px",
            textTransform: "uppercase",
        },
        ".Tab": {
            backgroundColor: "#070514",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
        },
        ".Tab:hover": {
            backgroundColor: "#191825",
        },
        ".Tab--selected": {
            backgroundColor: "#201e2c",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
        },
        ".AccordionItem": {
            backgroundColor: "#070514",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
        },
        ".AccordionItem:hover": {
            backgroundColor: "#191825",
        },
        ".AccordionItem--selected": {
            backgroundColor: "#191825",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
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
    onTaxIdTypeChange: (type: string) => void
    onTaxIdValueChange: (value: string) => void
    onTaxQuoteChange: (taxQuote: CheckoutTaxQuoteData | null) => void
    onPaymentConfirmationChange: (confirming: boolean) => void
    onSessionExpired: () => Promise<void>
    onSessionReady: () => void
    session: CheckoutSessionData
    taxIdType: string
    taxIdValue: string
}

function isInactiveCheckoutSessionError(message: string) {
    const normalizedMessage = message.toLowerCase()
    return (
        normalizedMessage.includes("checkout session") &&
        (normalizedMessage.includes("expired") || normalizedMessage.includes("no longer active") || normalizedMessage.includes("not active"))
    ) || normalizedMessage.includes("checkout-sitzung ist nicht mehr aktiv") || normalizedMessage.includes("checkout-sitzung ist abgelaufen")
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
        <div
            role="status"
            aria-label={label}
            data-testid="checkout-form-skeleton"
            className="w-full animate-pulse space-y-4 motion-reduce:animate-none"
        >
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
    onTaxIdTypeChange,
    onTaxIdValueChange,
    onTaxQuoteChange,
    onPaymentConfirmationChange,
    onSessionExpired,
    onSessionReady,
    taxIdType,
    taxIdValue,
}: Omit<CheckoutPaymentFormProps, "session">) {
    const checkoutState = useCheckoutElements()
    const { stage: activeStep, setStage } = useCheckoutStage()
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isUpdatingBilling, setIsUpdatingBilling] = useState(false)
    const [isConfirming, setIsConfirming] = useState(false)
    const checkoutErrorMessage = checkoutState.type === "error" ? checkoutState.error.message : null

    useEffect(() => {
        if (checkoutState.type === "success") {
            onSessionReady()
            return
        }

        if (checkoutErrorMessage && isInactiveCheckoutSessionError(checkoutErrorMessage)) void onSessionExpired()
    }, [checkoutErrorMessage, checkoutState.type, onSessionExpired, onSessionReady])

    const showBillingAddress = () => {
        setStage("billingAddress")
        setErrorMessage(null)
    }

    const showPayment = async () => {
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

            const normalizedTaxIdType = taxIdType.trim()
            const normalizedTaxIdValue = taxIdValue.trim()
            if (collectTaxId && Boolean(normalizedTaxIdType) !== Boolean(normalizedTaxIdValue)) {
                setErrorMessage(content.errors.taxIdIncomplete)
                return
            }

            if (collectTaxId && normalizedTaxIdType && normalizedTaxIdValue) {
                const taxIdResult = await checkoutState.checkout.updateTaxIdInfo({
                    businessName: billingAddress.name?.trim() || "",
                    taxId: {
                        type: normalizedTaxIdType as StripeCheckoutTaxIdType,
                        value: normalizedTaxIdValue,
                    },
                })
                if (taxIdResult.type === "error") {
                    setErrorMessage(content.errors.taxIdUpdate)
                    return
                }
                updatedSession = taxIdResult.session
            }

            onTaxQuoteChange(getTaxQuoteFromSession(updatedSession))
            setStage("payment")
        } catch (error) {
            console.error("Failed to update Stripe checkout billing details:", error)
            setErrorMessage(content.paymentErrorFallback)
        } finally {
            setIsUpdatingBilling(false)
        }
    }

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (checkoutState.type !== "success" || isConfirming) return

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
        const message = isInactiveCheckoutSessionError(checkoutState.error.message)
            ? content.errors.checkoutSessionExpired
            : content.errors.checkoutSession
        return <p className="text-sm text-error" role="alert">{message}</p>
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
                        {collectTaxId && (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <TextInput
                                    title={content.taxIdTypeLabel}
                                    placeholder={content.taxIdTypePlaceholder}
                                    value={taxIdType}
                                    onChange={(event) => onTaxIdTypeChange(event.currentTarget.value)}
                                    className="w-full!"
                                />
                                <TextInput
                                    title={content.taxIdValueLabel}
                                    placeholder={content.taxIdValuePlaceholder}
                                    value={taxIdValue}
                                    onChange={(event) => onTaxIdValueChange(event.currentTarget.value)}
                                    className="w-full!"
                                />
                            </div>
                        )}
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
                            {isUpdatingBilling ? content.processingLabel : content.continueLabel}
                        </Button>
                    </div>
                </>
            ) : (
                <>
                    <section className="w-full space-y-4">
                        <PaymentElement options={{ fields: { billingDetails: { name: "never", address: "never" } } }} />
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
                            disabled={isConfirming}
                            className="h-10! w-full! whitespace-nowrap bg-white/80! px-8! text-sm! text-primary! ring-1! ring-white/20! hover:bg-white!"
                        >
                            {isConfirming ? content.processingLabel : content.payNowLabel}
                        </Button>
                        <Button
                            type="button"
                            variant="normal"
                            disabled={isConfirming}
                            onClick={showBillingAddress}
                            className="h-10! w-full! border-white/10! bg-white/[0.03]! text-sm! text-secondary! hover:bg-white/[0.06]! hover:text-white!"
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
    onTaxIdTypeChange,
    onTaxIdValueChange,
    onTaxQuoteChange,
    onPaymentConfirmationChange,
    onSessionExpired,
    onSessionReady,
    session,
    taxIdType,
    taxIdValue,
}: CheckoutPaymentFormProps) {
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

    if (!stripePromise) {
        return <p className="text-sm text-error">Stripe is not configured.</p>
    }

    return (
        <CheckoutElementsProvider key={session.clientSecret} stripe={stripePromise} options={options}>
            <CheckoutPaymentFields
                billingAddress={billingAddress}
                collectTaxId={collectTaxId}
                content={content}
                email={email}
                onAddressChange={onAddressChange}
                onEmailChange={onEmailChange}
                onTaxIdTypeChange={onTaxIdTypeChange}
                onTaxIdValueChange={onTaxIdValueChange}
                onTaxQuoteChange={onTaxQuoteChange}
                onPaymentConfirmationChange={onPaymentConfirmationChange}
                onSessionExpired={onSessionExpired}
                onSessionReady={onSessionReady}
                taxIdType={taxIdType}
                taxIdValue={taxIdValue}
            />
        </CheckoutElementsProvider>
    )
}
