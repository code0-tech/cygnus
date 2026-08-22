"use client"

import type { CheckoutData, ErrorsContent } from "@/lib/cms"
import type { CheckoutSessionData, CheckoutStripePricingData, CheckoutTaxQuoteData } from "@/lib/checkout/checkoutSubmission"
import { AcceptTermsCheckbox } from "@/components/forms/AcceptTermsCheckbox"
import { useCheckoutStage } from "@/components/checkout/CheckoutStage"
import { ButtonLoader } from "@/components/ui/Loader"
import { SendOfferDialog } from "@/components/checkout/SendOfferDialog"
import { Button, EmailInput } from "@code0-tech/pictor"
import { IconAlertTriangle } from "@tabler/icons-react"
import { BillingAddressElement, CheckoutElementsProvider, ContactDetailsElement, PaymentElement, TaxIdElement, useCheckoutElements } from "@stripe/react-stripe-js/checkout"
import { loadStripe, type StripeCheckoutContact, type StripeCheckoutElementsSdkOptions, type StripeCheckoutSession } from "@stripe/stripe-js"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react"

type CheckoutFormContent = CheckoutData["form"]

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey, { betas: ["custom_checkout_tax_id_1"], locale: "en" }) : null
const STRIPE_APPEARANCE_VERSION = "pictor-7"
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
        tabIconColor: "rgba(255, 255, 255, 0.7)",
        tabIconHoverColor: "#ffffff",
        tabIconSelectedColor: "#ffffff",
        tabIconMoreColor: "rgba(255, 255, 255, 0.7)",
        tabIconMoreHoverColor: "#ffffff",
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
        ".Block": {
            backgroundColor: "#191825",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(191, 191, 191, 0.1)",
            outline: "none",
        },
        ".PickerItem": {
            backgroundColor: "#191825",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(191, 191, 191, 0.1)",
            outline: "none",
        },
        ".PickerItem--selected": {
            backgroundColor: "#191825",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(191, 191, 191, 0.1)",
            outline: "none",
        },
        ".PickerItem:focus": {
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(191, 191, 191, 0.1)",
            outline: "none",
        },
        ".PickerItem:hover": {
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(191, 191, 191, 0.1)",
            outline: "none",
        },
        ".PickerItem--highlight": {
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(191, 191, 191, 0.1)",
            outline: "none",
        },
        ".PickerItem:active": {
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(191, 191, 191, 0.1)",
            outline: "none",
        },
        ".PickerItem--selected:hover": {
            backgroundColor: "#191825",
            border: "none",
            borderColor: "transparent",
            borderWidth: "0px",
            boxShadow: "inset 0 1px 1px rgba(191, 191, 191, 0.1)",
            outline: "none",
            outlineOffset: "0px",
        },
        ".PickerItem--selected:focus": {
            backgroundColor: "#191825",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(191, 191, 191, 0.1)",
            outline: "none",
        },
        ".PickerItem--selected:active": {
            backgroundColor: "#191825",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(191, 191, 191, 0.1)",
            outline: "none",
        },
        ".PickerItem--highlight:hover": {
            backgroundColor: "#191825",
            border: "none",
            borderColor: "transparent",
            borderWidth: "0px",
            boxShadow: "inset 0 1px 1px rgba(191, 191, 191, 0.1)",
            outline: "none",
            outlineOffset: "0px",
        },
        ".PickerItem--highlight:focus": {
            backgroundColor: "#191825",
            border: "none",
            borderColor: "transparent",
            borderWidth: "0px",
            boxShadow: "inset 0 1px 1px rgba(191, 191, 191, 0.1)",
            outline: "none",
            outlineOffset: "0px",
        },
        ".PickerItem--highlight:active": {
            backgroundColor: "#191825",
            border: "none",
            borderColor: "transparent",
            borderWidth: "0px",
            boxShadow: "inset 0 1px 1px rgba(191, 191, 191, 0.1)",
            outline: "none",
            outlineOffset: "0px",
        },
        ".Tab": {
            backgroundColor: "#191825",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
            color: "rgba(255, 255, 255, 0.7)",
            padding: "12px 14px",
        },
        ".Tab:hover": {
            backgroundColor: "#201e2c",
            color: "#ffffff",
        },
        ".Tab--selected": {
            backgroundColor: "#302e3b",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.12)",
            color: "#ffffff",
        },
        ".Tab--selected:hover": {
            backgroundColor: "#302e3b",
            border: "none",
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.12)",
            color: "#ffffff",
        },
        ".Tab:focus": {
            backgroundColor: "#302e3b",
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.12)",
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
    billingAddressComplete: boolean
    collectTaxId: boolean
    content: CheckoutFormContent
    customerEmail: string | null
    errors: ErrorsContent
    customerSelect: ReactNode
    customerSelectSkeleton: ReactNode
    email: string | null
    emailComplete: boolean
    emailSyncedToStripe: boolean
    isBusinessCustomer: boolean
    onAddressChange: (address: StripeCheckoutContact | null, complete: boolean) => void
    onEmailChange: (email: string | null, complete: boolean) => void
    onEmailSyncedChange: (synced: boolean) => void
    onTaxQuoteChange: (taxQuote: CheckoutTaxQuoteData | null) => void
    onPaymentConfirmationChange: (confirming: boolean) => void
    onPricingChange: (pricing: CheckoutStripePricingData | null) => void
    onPromotionCodeActionsChange: (actions: { apply: (code: string) => Promise<void>; remove: () => Promise<void> } | null) => void
    onSessionExpired: () => Promise<boolean>
    onSessionLoadError: () => Promise<boolean>
    onSessionLoadErrorChange: (error: string | null) => void
    onSessionReady: () => void
    session: CheckoutSessionData
}

export function CheckoutErrorState({ message, onRetry, retryLabel }: { message: string; onRetry?: () => void; retryLabel?: string }) {
    return (
        <div
            role="alert"
            aria-live="assertive"
            className="flex w-full items-center gap-2 rounded-2xl border border-error/30 bg-error/10 p-4 text-error shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_12px_32px_rgba(0,0,0,0.18)]"
        >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-error/15 ring-1 ring-error/20">
                <IconAlertTriangle aria-hidden="true" size={21} stroke={1.8} />
            </span>
            <p className="min-w-0 flex-1 text-base font-medium leading-6 text-error">{message}</p>
            {onRetry && retryLabel ? (
                <Button type="button" variant="normal" onClick={onRetry} className="shrink-0 text-sm!">
                    {retryLabel}
                </Button>
            ) : null}
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

export function getStripePricingFromSession(session: StripeCheckoutSession): CheckoutStripePricingData | null {
    const divisor = session.minorUnitsAmountDivisor
    if (session.tax?.status !== "ready" || !Number.isFinite(divisor) || divisor <= 0) return null

    return {
        currency: session.currency,
        discountAmount: session.total.discount.minorUnitsAmount / divisor,
        subtotalPrice: session.total.subtotal.minorUnitsAmount / divisor,
        taxAmount: session.total.taxExclusive.minorUnitsAmount / divisor,
        totalPrice: session.total.total.minorUnitsAmount / divisor,
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
    billingAddressComplete,
    collectTaxId,
    content,
    customerEmail,
    errors,
    customerSelect,
    customerSelectSkeleton,
    email,
    emailComplete,
    emailSyncedToStripe,
    isBusinessCustomer,
    onAddressChange,
    onEmailChange,
    onEmailSyncedChange,
    onTaxQuoteChange,
    onPaymentConfirmationChange,
    onPricingChange,
    onPromotionCodeActionsChange,
    onSessionExpired,
    onSessionLoadError,
    onSessionLoadErrorChange,
    onSessionReady,
    sessionKey,
}: Omit<CheckoutPaymentFormProps, "session"> & { sessionKey: string }) {
    const checkoutState = useCheckoutElements()
    const { stage: activeStep, setStage } = useCheckoutStage()
    const params = useParams<{ locale?: string }>()
    const locale = params?.locale === "de" ? "de" : "en"

    const paymentFormId = useId()
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isUpdatingBilling, setIsUpdatingBilling] = useState(false)
    const [isConfirming, setIsConfirming] = useState(false)
    const [acceptedTerms, setAcceptedTerms] = useState(false)
    const [isPaymentElementReady, setIsPaymentElementReady] = useState(false)
    const [isPaymentDetailsComplete, setIsPaymentDetailsComplete] = useState(false)
    const [isContactDetailsComplete, setIsContactDetailsComplete] = useState(Boolean(customerEmail) || emailComplete)
    const [isBillingAddressComplete, setIsBillingAddressComplete] = useState(billingAddressComplete)
    const [isContactElementReady, setIsContactElementReady] = useState(false)
    const [isAddressElementReady, setIsAddressElementReady] = useState(false)
    const [isTaxIdElementReady, setIsTaxIdElementReady] = useState(!collectTaxId)
    const checkoutErrorMessage = checkoutState.type === "error" ? checkoutState.error.message : null
    const liveStripePricing = checkoutState.type === "success" ? getStripePricingFromSession(checkoutState.checkout) : null
    const promotionCodeCheckoutRef = useRef(checkoutState.type === "success" ? checkoutState.checkout : null)
    promotionCodeCheckoutRef.current = checkoutState.type === "success" ? checkoutState.checkout : null
    const restoredBillingRef = useRef(false)
    const markContactElementLoading = useCallback(() => setIsContactElementReady(false), [])
    const markAddressElementLoading = useCallback(() => setIsAddressElementReady(false), [])
    const markTaxIdElementLoading = useCallback(() => setIsTaxIdElementReady(false), [])
    const markContactElementReady = useCallback(() => setIsContactElementReady(true), [])
    const markAddressElementReady = useCallback(() => setIsAddressElementReady(true), [])
    const markTaxIdElementReady = useCallback(() => setIsTaxIdElementReady(true), [])

    // The success page redirects back here with this flag when Crater reports a failed payment, so the
    // customer lands directly back in checkout with the failure explained instead of stuck on that page.
    // Stripped via history.replaceState (not the router) so it doesn't re-trigger session preparation.
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

    useEffect(() => {
        if (checkoutState.type === "success" && isContactElementReady && isAddressElementReady && isTaxIdElementReady) onSessionReady()
    }, [checkoutState.type, isAddressElementReady, isContactElementReady, isTaxIdElementReady, onSessionReady])

    useEffect(() => {
        onPricingChange(liveStripePricing)
    }, [liveStripePricing?.currency, liveStripePricing?.discountAmount, liveStripePricing?.subtotalPrice, liveStripePricing?.taxAmount, liveStripePricing?.totalPrice, onPricingChange])

    useEffect(() => {
        if (checkoutState.type !== "success") {
            onPromotionCodeActionsChange(null)
            return
        }

        const syncSessionPricing = (session: StripeCheckoutSession) => {
            onTaxQuoteChange(getTaxQuoteFromSession(session))
            onPricingChange(getStripePricingFromSession(session))
        }
        onPromotionCodeActionsChange({
            apply: async (code) => {
                const checkout = promotionCodeCheckoutRef.current
                if (!checkout) throw new Error(errors.checkoutSession)
                const result = await checkout.applyPromotionCode(code)
                if (result.type === "error") throw new Error(result.error.message)
                syncSessionPricing(result.session)
            },
            remove: async () => {
                const checkout = promotionCodeCheckoutRef.current
                if (!checkout) throw new Error(errors.checkoutSession)
                const result = await checkout.removePromotionCode()
                if (result.type === "error") throw new Error(result.error.message)
                syncSessionPricing(result.session)
            },
        })

        return () => onPromotionCodeActionsChange(null)
    }, [checkoutState.type, errors.checkoutSession, onPricingChange, onPromotionCodeActionsChange, onTaxQuoteChange, sessionKey])

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

    const updateCheckoutBilling = useCallback(
        async (moveToPayment: boolean) => {
            if (!billingAddress || !email || !isBillingAddressComplete || !isContactDetailsComplete || checkoutState.type !== "success" || isUpdatingBilling) return

            setIsUpdatingBilling(true)
            setErrorMessage(null)
            try {
                const billingResult = await checkoutState.checkout.updateBillingAddress(billingAddress)
                if (billingResult.type === "error") {
                    setErrorMessage(errors.billingAddressUpdate)
                    return
                }
                let updatedSession = billingResult.session

                // A restored payment stage means this checkout already wrote the entered email before
                // the discount reload. Draft customers may not expose that Stripe email locally yet.
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
                setIsPaymentElementReady(false)
                if (moveToPayment) setStage("payment")
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
                setErrorMessage(errors.billingAddressUpdate)
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
                setErrorMessage(errors.paymentConfirmation)
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
            setErrorMessage(errors.paymentConfirmation)
        }
    }

    if (checkoutState.type === "loading") {
        return <CheckoutPaymentFormSkeleton label={content.processingLabel} />
    }

    if (checkoutState.type === "error") {
        return <CheckoutPaymentFormSkeleton label={content.processingLabel} />
    }

    return (
        <div className="w-full space-y-6">
            {activeStep === "billingAddress" && customerSelect ? (isContactElementReady && isAddressElementReady && isTaxIdElementReady ? customerSelect : customerSelectSkeleton) : null}
            {activeStep === "billingAddress" ? (
                <>
                    <section className="w-full space-y-4">
                        {customerEmail ? (
                            <EmailInput title={content.emailLabel} value={customerEmail} disabled className="w-full! bg-[#17151e]! hover:bg-[#17151e]! text-tertiary/50!" />
                        ) : (
                            <ContactDetailsElement
                                onChange={(event) => {
                                    setIsContactDetailsComplete(event.complete)
                                    onEmailChange(event.value.email || null, event.complete)
                                }}
                                onLoaderStart={markContactElementLoading}
                                onReady={markContactElementReady}
                            />
                        )}
                        <BillingAddressElement
                            options={{ display: { name: "full" } }}
                            onChange={(event) => {
                                setIsBillingAddressComplete(event.complete)
                                onAddressChange({ name: event.value.name, address: event.value.address }, event.complete)
                            }}
                            onLoaderStart={markAddressElementLoading}
                            onReady={markAddressElementReady}
                        />
                        {collectTaxId && <TaxIdElement options={{ fields: { businessName: "never" }, visibility: "auto" }} onLoaderStart={markTaxIdElementLoading} onReady={markTaxIdElementReady} />}
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
                            disabled={!billingAddress || !email || !isBillingAddressComplete || !isContactDetailsComplete || isUpdatingBilling}
                            onClick={() => void showPayment()}
                            className="h-10! w-full! whitespace-nowrap bg-white/80! px-8! text-sm! text-primary! ring-1! ring-white/20! hover:bg-white!"
                        >
                            {isUpdatingBilling ? <ButtonLoader label={content.processingLabel} /> : content.continueLabel}
                        </Button>
                        {isBusinessCustomer && <SendOfferDialog content={content} initialEmail={email} />}
                    </div>
                </>
            ) : (
                <>
                    <form id={paymentFormId} onSubmit={handleSubmit} className="w-full space-y-4">
                        <PaymentElement
                            options={{ layout: "tabs", fields: { billingDetails: { name: "never", address: "never" } } }}
                            onLoaderStart={() => {
                                setIsPaymentElementReady(false)
                                setIsPaymentDetailsComplete(false)
                            }}
                            onReady={() => setIsPaymentElementReady(true)}
                            onChange={(event) => setIsPaymentDetailsComplete(event.complete)}
                        />
                    </form>

                    <AcceptTermsCheckbox locale={locale} initialValue={false} formValidation={{ setValue: setAcceptedTerms, valid: true }} />

                    {errorMessage && (
                        <p className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error" role="alert">
                            {errorMessage}
                        </p>
                    )}

                    <div className="space-y-3">
                        <Button
                            type="submit"
                            form={paymentFormId}
                            variant="normal"
                            disabled={isConfirming || isUpdatingBilling || !isPaymentElementReady || !isPaymentDetailsComplete || !acceptedTerms}
                            className="h-10! w-full! whitespace-nowrap bg-white/80! px-8! text-sm! text-primary! ring-1! ring-white/20! hover:bg-white!"
                        >
                            {isConfirming ? <ButtonLoader label={content.processingLabel} /> : content.payNowLabel}
                        </Button>
                        <Button
                            type="button"
                            variant="normal"
                            disabled={isConfirming}
                            onClick={showBillingAddress}
                            className="h-10! w-full! border-none! bg-transparent! text-sm! text-tertiary! shadow-none! hover:bg-white/6! hover:text-white! transition-colors!"
                        >
                            {content.backToBillingLabel}
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}

export function CheckoutPaymentForm({
    billingAddress,
    billingAddressComplete,
    collectTaxId,
    content,
    customerEmail,
    errors,
    customerSelect,
    customerSelectSkeleton,
    email,
    emailComplete,
    emailSyncedToStripe,
    isBusinessCustomer,
    onAddressChange,
    onEmailChange,
    onEmailSyncedChange,
    onTaxQuoteChange,
    onPaymentConfirmationChange,
    onPricingChange,
    onPromotionCodeActionsChange,
    onSessionExpired,
    onSessionLoadError,
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
                ...(email && !customerEmail && !emailSyncedToStripe ? { email } : {}),
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
        <CheckoutElementsProvider key={`${session.clientSecret}:${STRIPE_APPEARANCE_VERSION}`} stripe={stripeRef.current} options={options}>
            <CheckoutPaymentFields
                billingAddress={billingAddress}
                billingAddressComplete={billingAddressComplete}
                collectTaxId={collectTaxId}
                content={content}
                customerEmail={customerEmail}
                errors={errors}
                customerSelect={customerSelect}
                customerSelectSkeleton={customerSelectSkeleton}
                email={email}
                emailComplete={emailComplete}
                emailSyncedToStripe={emailSyncedToStripe}
                isBusinessCustomer={isBusinessCustomer}
                onAddressChange={onAddressChange}
                onEmailChange={onEmailChange}
                onEmailSyncedChange={onEmailSyncedChange}
                onTaxQuoteChange={onTaxQuoteChange}
                onPaymentConfirmationChange={onPaymentConfirmationChange}
                onPricingChange={onPricingChange}
                onPromotionCodeActionsChange={onPromotionCodeActionsChange}
                onSessionExpired={onSessionExpired}
                onSessionLoadError={onSessionLoadError}
                onSessionLoadErrorChange={onSessionLoadErrorChange}
                onSessionReady={onSessionReady}
                sessionKey={session.clientSecret}
            />
        </CheckoutElementsProvider>
    )
}
