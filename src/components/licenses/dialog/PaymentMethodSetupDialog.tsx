"use client"

import { PaymentMethodSetupElement, PaymentMethodSetupPendingStatus, type PaymentMethodSetupOwner } from "@/components/licenses/dialog/PaymentMethodSetupElement"
import { LicenseDialog } from "@/components/licenses/dialog/LicenseDialog"
import type { ErrorsContent, LicenseContent } from "@/lib/cms"
import { Button, Text } from "@code0-tech/pictor"
import { useEffect, useRef, useState } from "react"

interface PaymentMethodSetupDialogProps {
    content: LicenseContent
    disabled?: boolean
    errors: ErrorsContent
    onSuccess: () => void
    owner: PaymentMethodSetupOwner
    returnPath: string
    triggerLabel: string
}

export function PaymentMethodSetupDialog({ content, disabled = false, errors, onSuccess, owner, returnPath, triggerLabel }: PaymentMethodSetupDialogProps) {
    const requestStartedRef = useRef(false)
    const [open, setOpen] = useState(false)
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [pendingSetupIntentId, setPendingSetupIntentId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const close = () => {
        setOpen(false)
        setClientSecret(null)
        setPendingSetupIntentId(null)
        setError(null)
        setIsLoading(false)
        requestStartedRef.current = false
    }

    useEffect(() => {
        const currentUrl = new URL(window.location.href)
        const setupIntentId = currentUrl.searchParams.get("setup_intent")
        if (!setupIntentId || !/^seti_[A-Za-z0-9]+$/.test(setupIntentId)) return

        setPendingSetupIntentId(setupIntentId)
        setOpen(true)
    }, [])

    useEffect(() => {
        if (!open || pendingSetupIntentId || requestStartedRef.current) return

        requestStartedRef.current = true
        setIsLoading(true)
        setError(null)
        let active = true

        const createUrl = owner.type === "customer" ? "/api/crater/customer/payment-method-setup" : "/api/crater/subscriptions/payment-method-setup"
        const createBody = owner.type === "customer" ? { customerId: owner.customerId } : { subscriptionId: owner.subscriptionId }

        void fetch(createUrl, {
            method: "POST",
            credentials: "same-origin",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(createBody),
        })
            .then(async (response) => {
                const result: unknown = await response.json()
                if (!response.ok || !result || typeof result !== "object" || !("clientSecret" in result) || typeof result.clientSecret !== "string") {
                    throw new Error(errors.paymentMethodUpdate)
                }
                return result.clientSecret
            })
            .then((nextClientSecret) => {
                if (active) setClientSecret(nextClientSecret)
            })
            .catch(() => {
                if (active) setError(errors.paymentMethodUpdate)
            })
            .finally(() => {
                if (active) setIsLoading(false)
            })

        return () => {
            active = false
        }
    }, [errors.paymentMethodUpdate, open, owner, pendingSetupIntentId])

    return (
        <>
            <Button type="button" variant="normal" disabled={disabled} onClick={() => setOpen(true)}>
                {triggerLabel}
            </Button>

            <LicenseDialog backLabel={content.editor.cancelLabel} description={content.editor.paymentMethodDescription} onClose={close} open={open} title={content.editor.paymentMethodHeading}>
                <div>
                    {isLoading ? (
                        <div role="status" className="space-y-4 animate-pulse motion-reduce:animate-none">
                            <span className="sr-only">{content.editor.loadingPaymentMethodLabel}</span>
                            <div aria-hidden="true" className="h-14 rounded-2xl bg-white/8" />
                            <div aria-hidden="true" className="h-14 rounded-2xl bg-white/8" />
                            <div aria-hidden="true" className="ml-auto h-10 w-40 rounded-xl bg-white/8" />
                        </div>
                    ) : error ? (
                        <Text role="alert" size="sm" className="text-error!">
                            {error}
                        </Text>
                    ) : pendingSetupIntentId ? (
                        <PaymentMethodSetupPendingStatus
                            content={content.editor}
                            errorMessage={errors.paymentMethodUpdate}
                            onCancel={close}
                            onSuccess={onSuccess}
                            owner={owner}
                            retryLabel={errors.retry}
                            setupIntentId={pendingSetupIntentId}
                        />
                    ) : clientSecret ? (
                        <PaymentMethodSetupElement
                            clientSecret={clientSecret}
                            content={content.editor}
                            errorMessage={errors.paymentMethodUpdate}
                            onCancel={close}
                            onSuccess={onSuccess}
                            owner={owner}
                            retryLabel={errors.retry}
                            returnPath={returnPath}
                        />
                    ) : null}
                </div>
            </LicenseDialog>
        </>
    )
}
