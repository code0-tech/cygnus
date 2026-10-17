"use client"

import { PaymentMethodSetupElement } from "@/components/licenses/dialog/PaymentMethodSetupElement"
import type { LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, Text } from "@code0-tech/pictor"
import { IconX } from "@tabler/icons-react"
import { useEffect, useRef, useState } from "react"

interface PaymentMethodSetupDialogProps {
    content: LicenseContent
    customerId: string
    disabled?: boolean
    locale: AppLocale
    onSuccess: () => void
}

export function PaymentMethodSetupDialog({ content, customerId, disabled = false, locale, onSuccess }: PaymentMethodSetupDialogProps) {
    const requestStartedRef = useRef(false)
    const [open, setOpen] = useState(false)
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const close = () => {
        setOpen(false)
        setClientSecret(null)
        setError(null)
        setIsLoading(false)
        requestStartedRef.current = false
    }

    useEffect(() => {
        if (!open || requestStartedRef.current) return

        requestStartedRef.current = true
        setIsLoading(true)
        setError(null)
        let active = true

        void fetch("/api/crater/customer/payment-method-setup", {
            method: "POST",
            credentials: "same-origin",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ customerId }),
        })
            .then(async (response) => {
                const result: unknown = await response.json()
                if (!response.ok || !result || typeof result !== "object" || !("clientSecret" in result) || typeof result.clientSecret !== "string") {
                    throw new Error(content.editor.paymentMethodSetupError)
                }
                return result.clientSecret
            })
            .then((nextClientSecret) => {
                if (active) setClientSecret(nextClientSecret)
            })
            .catch(() => {
                if (active) setError(content.editor.paymentMethodSetupError)
            })
            .finally(() => {
                if (active) setIsLoading(false)
            })

        return () => {
            active = false
        }
    }, [content.editor.paymentMethodSetupError, customerId, open])

    return (
        <>
            <Button type="button" variant="normal" disabled={disabled} onClick={() => setOpen(true)}>
                {content.editor.changePaymentMethodLabel}
            </Button>

            <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && close()}>
                <DialogPortal>
                    <DialogOverlay className="backdrop-blur-sm" />
                    <DialogContent className="max-h-[calc(100dvh-2rem)]! w-[calc(100vw-2rem)]! max-w-xl! overflow-y-auto! border border-white/5 bg-primary! p-4! sm:p-6!">
                        <DialogHeader className="pr-10 text-left!">
                            <DialogTitle className="font-normal! text-white!">{content.editor.paymentMethodHeading}</DialogTitle>
                            <DialogDescription className="text-sm! text-secondary!">{content.editor.paymentMethodDescription}</DialogDescription>
                        </DialogHeader>
                        <div className="absolute right-4 top-4 z-10">
                            <Button type="button" variant="none" onClick={close} aria-label={content.editor.closeLabel} className="size-9! p-0! text-secondary! hover:text-white!">
                                <IconX aria-hidden="true" size={18} />
                            </Button>
                        </div>

                        <div className="pt-6">
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
                            ) : clientSecret ? (
                                <PaymentMethodSetupElement
                                    clientSecret={clientSecret}
                                    content={content.editor}
                                    onCancel={close}
                                    onSuccess={onSuccess}
                                    returnPath={`/${locale}/licenses/customer/${encodeURIComponent(customerId)}`}
                                />
                            ) : null}
                        </div>
                    </DialogContent>
                </DialogPortal>
            </Dialog>
        </>
    )
}
