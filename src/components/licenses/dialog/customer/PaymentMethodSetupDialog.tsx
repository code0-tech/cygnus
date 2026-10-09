"use client"

import { PaymentMethodSetupElement, PaymentMethodSetupPendingStatus, type PaymentMethodSetupOwner } from "@/components/licenses/dialog/customer/PaymentMethodSetupElement"
import { LicenseDialog } from "@/components/licenses/dialog/shared/LicenseDialog"
import { LicenseTabAlert, LicenseTabHeader } from "@/components/licenses/dialog/shared/LicenseTabLayout"
import { createPaymentMethodSetup } from "@/lib/licenses/client"
import type { ErrorsContent, LicenseContent } from "@/lib/cms"
import { Button, Spacing } from "@code0-tech/pictor"
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
    const [pendingSetupIntentClientSecret, setPendingSetupIntentClientSecret] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const close = () => {
        setOpen(false)
        setClientSecret(null)
        setPendingSetupIntentClientSecret(null)
        setError(null)
        setIsLoading(false)
        requestStartedRef.current = false
    }

    useEffect(() => {
        const currentUrl = new URL(window.location.href)
        const setupIntentId = currentUrl.searchParams.get("setup_intent")
        const setupIntentClientSecret = currentUrl.searchParams.get("setup_intent_client_secret")
        if (!setupIntentId || !/^seti_[A-Za-z0-9]+$/.test(setupIntentId) || !setupIntentClientSecret?.startsWith(`${setupIntentId}_secret_`)) return

        setPendingSetupIntentClientSecret(setupIntentClientSecret)
        setOpen(true)
        currentUrl.searchParams.delete("setup_intent")
        currentUrl.searchParams.delete("setup_intent_client_secret")
        currentUrl.searchParams.delete("redirect_status")
        window.history.replaceState(window.history.state, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`)
    }, [])

    useEffect(() => {
        if (!open || pendingSetupIntentClientSecret || requestStartedRef.current) return

        requestStartedRef.current = true
        setIsLoading(true)
        setError(null)
        let active = true

        void createPaymentMethodSetup(owner.customerId, errors.paymentMethodUpdate)
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
    }, [errors.paymentMethodUpdate, open, owner, pendingSetupIntentClientSecret])

    return (
        <>
            <Button type="button" variant="normal" paddingSize="xxs" disabled={disabled} onClick={() => setOpen(true)}>
                {triggerLabel}
            </Button>

            <LicenseDialog backLabel={content.editor.closeLabel} description={content.editor.paymentMethodDescription} onClose={close} open={open} title={triggerLabel}>
                <div>
                    {isLoading ? (
                        <>
                            <LicenseTabHeader title={content.editor.addPaymentMethodLabel} description={content.editor.paymentMethodDescription} />
                            <Spacing spacing="md" />
                            <div role="status" className="space-y-4 animate-pulse motion-reduce:animate-none">
                                <span className="sr-only">{content.editor.loadingPaymentMethodLabel}</span>
                                <div aria-hidden="true" className="h-14 rounded-2xl bg-white/8" />
                                <div aria-hidden="true" className="h-14 rounded-2xl bg-white/8" />
                            </div>
                        </>
                    ) : error ? (
                        <>
                            <LicenseTabHeader title={content.editor.addPaymentMethodLabel} description={content.editor.paymentMethodDescription} />
                            <LicenseTabAlert>{error}</LicenseTabAlert>
                        </>
                    ) : pendingSetupIntentClientSecret ? (
                        <PaymentMethodSetupPendingStatus
                            content={content.editor}
                            errorMessage={errors.paymentMethodUpdate}
                            onSuccess={onSuccess}
                            retryLabel={errors.retry}
                            clientSecret={pendingSetupIntentClientSecret}
                        />
                    ) : clientSecret ? (
                        <PaymentMethodSetupElement
                            clientSecret={clientSecret}
                            content={content.editor}
                            errorMessage={errors.paymentMethodUpdate}
                            onSuccess={onSuccess}
                            retryLabel={errors.retry}
                            returnPath={returnPath}
                        />
                    ) : null}
                </div>
            </LicenseDialog>
        </>
    )
}
