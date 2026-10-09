"use client"

import { LicenseTabAlert, LicenseTabHeader, LicenseTabSaveButton } from "@/components/licenses/dialog/shared/LicenseTabLayout"
import { ButtonLoader } from "@/components/ui/Loader"
import type { LicenseContent } from "@/lib/cms"
import { Button, Spacing, Text } from "@code0-tech/pictor"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe, type Appearance, type StripeElementsOptions } from "@stripe/stripe-js"
import { useEffect, useMemo, useRef, useState } from "react"

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null

const appearance = {
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
        spacingUnit: "4px",
        borderRadius: "16px",
        focusBoxShadow: "none",
        focusOutline: "none",
    },
    rules: {
        ".Input": { backgroundColor: "#272532", border: "none", boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)", padding: "11px" },
        ".Input:hover": { backgroundColor: "rgba(191, 191, 191, 0.15)" },
        ".Input:focus": { backgroundColor: "rgba(191, 191, 191, 0.15)", border: "none", boxShadow: "none", outline: "none" },
        ".Input--invalid": { backgroundColor: "#1c0516", border: "none", boxShadow: "inset 0 1px 1px rgba(217, 4, 41, 0.1)" },
        ".Dropdown": { backgroundColor: "#191825", border: "none", borderRadius: "16px", boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 12px 32px rgba(0, 0, 0, 0.35)" },
        ".DropdownItem": { backgroundColor: "transparent", borderRadius: "10px", color: "rgba(255, 255, 255, 0.75)", fontSize: "13px", margin: "4px", padding: "10px 12px" },
        ".DropdownItem--highlight": { backgroundColor: "#201e2c", color: "#ffffff" },
        ".DropdownItem:active": { backgroundColor: "rgba(191, 191, 191, 0.2)", color: "#ffffff" },
        ".DropdownItem:focus": { backgroundColor: "#201e2c", color: "#ffffff", outline: "none" },
        ".Tab": { backgroundColor: "#191825", border: "none", boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)" },
        ".Tab:hover": { backgroundColor: "#201e2c" },
        ".Tab--selected": { backgroundColor: "#201e2c", border: "none", boxShadow: "none" },
        ".Tab:focus": { backgroundColor: "#2b2938", boxShadow: "none", outline: "none" },
        ".AccordionItem": { backgroundColor: "#191825", border: "none", boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)" },
        ".AccordionItem:hover": { backgroundColor: "#201e2c" },
        ".AccordionItem--selected": { backgroundColor: "#201e2c", border: "none", boxShadow: "none" },
        ".AccordionItem:focus-visible": { backgroundColor: "#2b2938", boxShadow: "none", outline: "none" },
        ".Label": { color: "rgba(255, 255, 255, 0.5)", fontSize: "11px", fontWeight: "400", textTransform: "uppercase" },
    },
} satisfies Appearance

export type PaymentMethodSetupOwner = { customerId: string }

interface PaymentMethodSetupElementProps {
    clientSecret: string
    content: LicenseContent["editor"]
    errorMessage: string
    onSuccess: () => void
    retryLabel: string
    returnPath: string
}

interface PaymentMethodSetupPendingStatusProps {
    content: LicenseContent["editor"]
    errorMessage: string
    onSuccess: () => void
    retryLabel: string
    clientSecret: string
}

export function PaymentMethodSetupPendingStatus({ content, errorMessage, onSuccess, retryLabel, clientSecret }: PaymentMethodSetupPendingStatusProps) {
    const [isComplete, setIsComplete] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [retryKey, setRetryKey] = useState(0)
    const successHandledRef = useRef(false)

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout> | undefined
        let active = true

        const checkStatus = async () => {
            try {
                const stripe = await stripePromise
                if (!stripe) throw new Error("Stripe is not configured.")
                const result = await stripe.retrieveSetupIntent(clientSecret)
                if (!active) return
                if (result.error || !result.setupIntent) throw new Error("Could not check the payment method setup.")

                if (result.setupIntent.status === "succeeded") {
                    setIsComplete(true)
                    if (!successHandledRef.current) {
                        successHandledRef.current = true
                        onSuccess()
                    }
                    return
                }
                if (result.setupIntent.status === "canceled" || result.setupIntent.status === "requires_payment_method") {
                    setError(errorMessage)
                    return
                }
                timeout = setTimeout(() => void checkStatus(), 1_250)
            } catch (statusError) {
                if (!active) return
                if (statusError instanceof DOMException && statusError.name === "AbortError") return
                setError(errorMessage)
            }
        }

        void checkStatus()
        return () => {
            active = false
            if (timeout) clearTimeout(timeout)
        }
    }, [clientSecret, errorMessage, onSuccess, retryKey])

    return (
        <>
            <LicenseTabHeader
                title={content.addPaymentMethodLabel}
                description={content.paymentMethodDescription}
                action={
                    error ? (
                        <Button
                            type="button"
                            variant="normal"
                            paddingSize="xxs"
                            onClick={() => {
                                setError(null)
                                setRetryKey((current) => current + 1)
                            }}
                        >
                            {retryLabel}
                        </Button>
                    ) : null
                }
            />
            <Spacing spacing="md" />
            {isComplete ? (
                <Text role="status" size="sm" className="text-brand!">
                    {content.paymentMethodSuccess}
                </Text>
            ) : error ? (
                <Text role="alert" size="sm" className="text-error!">
                    {error}
                </Text>
            ) : (
                <div role="status">
                    <ButtonLoader label={content.savingPaymentMethodLabel} />
                </div>
            )}
        </>
    )
}

function PaymentMethodSetupForm({ clientSecret, content, errorMessage, onSuccess, retryLabel, returnPath }: PaymentMethodSetupElementProps) {
    const stripe = useStripe()
    const elements = useElements()
    const [isReady, setIsReady] = useState(false)
    const [isConfirming, setIsConfirming] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [setupIntentClientSecret, setSetupIntentClientSecret] = useState<string | null>(null)

    const confirm = async () => {
        if (!stripe || !elements || !isReady || isConfirming) return
        setIsConfirming(true)
        setError(null)

        const result = await stripe.confirmSetup({
            elements,
            confirmParams: { return_url: new URL(returnPath, window.location.origin).toString() },
            redirect: "if_required",
        })

        if (result.error) {
            setError(errorMessage)
            setIsConfirming(false)
            return
        }

        if (!result.setupIntent?.id) {
            setError(errorMessage)
            setIsConfirming(false)
            return
        }

        setSetupIntentClientSecret(clientSecret)
        setIsConfirming(false)
    }

    if (setupIntentClientSecret)
        return <PaymentMethodSetupPendingStatus content={content} errorMessage={errorMessage} onSuccess={onSuccess} retryLabel={retryLabel} clientSecret={setupIntentClientSecret} />

    return (
        <>
            <LicenseTabHeader
                title={content.addPaymentMethodLabel}
                description={content.paymentMethodDescription}
                action={
                    <LicenseTabSaveButton disabled={!stripe || !elements || !isReady || isConfirming} onClick={() => void confirm()}>
                        {isConfirming ? <ButtonLoader label={content.savingPaymentMethodLabel} /> : content.savePaymentMethodLabel}
                    </LicenseTabSaveButton>
                }
            />
            {error ? <LicenseTabAlert>{error}</LicenseTabAlert> : null}
            <Spacing spacing="md" />
            <PaymentElement onLoaderStart={() => setIsReady(false)} onReady={() => setIsReady(true)} />
        </>
    )
}

export function PaymentMethodSetupElement({ clientSecret, content, errorMessage, onSuccess, retryLabel, returnPath }: PaymentMethodSetupElementProps) {
    const stripeRef = useRef(stripePromise)
    const options = useMemo<StripeElementsOptions>(() => ({ appearance, clientSecret }), [clientSecret])

    if (!stripeRef.current) {
        return (
            <p role="alert" className="text-sm text-error">
                {errorMessage}
            </p>
        )
    }

    return (
        <Elements key={clientSecret} stripe={stripeRef.current} options={options}>
            <PaymentMethodSetupForm clientSecret={clientSecret} content={content} errorMessage={errorMessage} onSuccess={onSuccess} retryLabel={retryLabel} returnPath={returnPath} />
        </Elements>
    )
}
