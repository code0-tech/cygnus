"use client"

import { ButtonLoader } from "@/components/ui/Loader"
import type { LicenseContent } from "@/lib/cms"
import { Button, Text } from "@code0-tech/pictor"
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

interface PaymentMethodSetupElementProps {
    clientSecret: string
    content: LicenseContent["editor"]
    customerId: string
    errorMessage: string
    onCancel: () => void
    onSuccess: () => void
    retryLabel: string
    returnPath: string
}

interface PaymentMethodSetupPendingStatusProps {
    content: LicenseContent["editor"]
    customerId: string
    errorMessage: string
    onCancel: () => void
    onSuccess: () => void
    retryLabel: string
    setupIntentId: string
}

export function PaymentMethodSetupPendingStatus({ content, customerId, errorMessage, onCancel, onSuccess, retryLabel, setupIntentId }: PaymentMethodSetupPendingStatusProps) {
    const [isComplete, setIsComplete] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [retryKey, setRetryKey] = useState(0)

    useEffect(() => {
        const controller = new AbortController()
        let timeout: ReturnType<typeof setTimeout> | undefined

        const checkStatus = async () => {
            try {
                const statusUrl = new URL("/api/crater/customer/payment-method-setup", window.location.origin)
                statusUrl.searchParams.set("customerId", customerId)
                statusUrl.searchParams.set("setupIntentId", setupIntentId)
                const response = await fetch(statusUrl, {
                    cache: "no-store",
                    credentials: "same-origin",
                    signal: controller.signal,
                })
                const result: unknown = await response.json()

                if (!response.ok || !result || typeof result !== "object" || !("status" in result)) throw new Error("Invalid payment method setup status response.")
                if (result.status === "ready") {
                    setIsComplete(true)
                    onSuccess()
                    return
                }
                if (result.status === "failed") {
                    setError(errorMessage)
                    return
                }
                if (result.status !== "pending") throw new Error("Invalid payment method setup status.")

                timeout = setTimeout(() => void checkStatus(), 1_250)
            } catch (statusError) {
                if (statusError instanceof DOMException && statusError.name === "AbortError") return
                setError(errorMessage)
            }
        }

        void checkStatus()
        return () => {
            controller.abort()
            if (timeout) clearTimeout(timeout)
        }
    }, [customerId, errorMessage, onSuccess, retryKey, setupIntentId])

    if (isComplete) {
        return (
            <div className="space-y-3">
                <Text role="status" size="sm" className="text-brand!">
                    {content.paymentMethodSuccess}
                </Text>
                <Button type="button" variant="normal" onClick={onCancel}>
                    {content.closeLabel}
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {error ? (
                <p role="alert" className="text-sm text-error">
                    {error}
                </p>
            ) : (
                <div role="status">
                    <ButtonLoader label={content.savingPaymentMethodLabel} />
                </div>
            )}
            <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="none" onClick={onCancel}>
                    {content.closeLabel}
                </Button>
                {error ? (
                    <Button
                        type="button"
                        variant="normal"
                        onClick={() => {
                            setError(null)
                            setRetryKey((current) => current + 1)
                        }}
                    >
                        {retryLabel}
                    </Button>
                ) : null}
            </div>
        </div>
    )
}

function PaymentMethodSetupForm({ content, customerId, errorMessage, onCancel, onSuccess, retryLabel, returnPath }: Omit<PaymentMethodSetupElementProps, "clientSecret">) {
    const stripe = useStripe()
    const elements = useElements()
    const [isReady, setIsReady] = useState(false)
    const [isConfirming, setIsConfirming] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [setupIntentId, setSetupIntentId] = useState<string | null>(null)

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

        setSetupIntentId(result.setupIntent.id)
        setIsConfirming(false)
    }

    if (setupIntentId)
        return (
            <PaymentMethodSetupPendingStatus
                content={content}
                customerId={customerId}
                errorMessage={errorMessage}
                onCancel={onCancel}
                onSuccess={onSuccess}
                retryLabel={retryLabel}
                setupIntentId={setupIntentId}
            />
        )

    return (
        <div className="space-y-4">
            <PaymentElement onLoaderStart={() => setIsReady(false)} onReady={() => setIsReady(true)} />
            {error ? (
                <p role="alert" className="text-sm text-error">
                    {error}
                </p>
            ) : null}
            <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="none" disabled={isConfirming} onClick={onCancel}>
                    {content.cancelLabel}
                </Button>
                <Button type="button" variant="filled" disabled={!stripe || !elements || !isReady || isConfirming} onClick={() => void confirm()}>
                    {isConfirming ? <ButtonLoader label={content.savingPaymentMethodLabel} /> : content.savePaymentMethodLabel}
                </Button>
            </div>
        </div>
    )
}

export function PaymentMethodSetupElement({ clientSecret, content, customerId, errorMessage, onCancel, onSuccess, retryLabel, returnPath }: PaymentMethodSetupElementProps) {
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
            <PaymentMethodSetupForm content={content} customerId={customerId} errorMessage={errorMessage} onCancel={onCancel} onSuccess={onSuccess} retryLabel={retryLabel} returnPath={returnPath} />
        </Elements>
    )
}
