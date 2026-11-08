"use client"

import { SiteDialogContent } from "@/components/ui/SiteDialog"
import { ButtonLoader } from "@/components/ui/Loader"
import type { CheckoutData } from "@/lib/cms"
import { Alert, Button, Dialog, DialogFooter, DialogTrigger, EmailInput, emailValidation } from "@code0-tech/pictor"
import { type SubmitEvent, useEffect, useState } from "react"

type SendOfferContent = Pick<
    CheckoutData["form"],
    "emailLabel" | "emailPlaceholder" | "processingLabel" | "sendOfferDescription" | "sendOfferLabel" | "sendOfferPrompt" | "sendOfferSuccess" | "sendOfferTitle"
>

interface SendOfferDialogProps {
    // Explains why no offer can be made out yet, for example a billing address that is still missing.
    blockedReason?: string | null
    content: SendOfferContent
    emailLocked?: boolean
    initialEmail?: string | null
    onSend: (email: string) => Promise<void>
}

export function SendOfferDialog({ blockedReason = null, content, emailLocked = false, initialEmail, onSend }: SendOfferDialogProps) {
    const [open, setOpen] = useState(false)
    const [email, setEmail] = useState(initialEmail?.trim() ?? "")
    const [isSending, setIsSending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sentTo, setSentTo] = useState<string | null>(null)
    const normalizedEmail = email.trim()
    const validEmail = emailValidation(normalizedEmail)

    useEffect(() => setEmail(initialEmail?.trim() ?? ""), [initialEmail])

    const changeOpen = (nextOpen: boolean) => {
        if (isSending) return
        setOpen(nextOpen)
        if (!nextOpen) {
            setError(null)
            setSentTo(null)
        }
    }

    const submit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!validEmail || isSending || blockedReason) return

        setIsSending(true)
        setError(null)
        try {
            await onSend(normalizedEmail)
            setSentTo(normalizedEmail)
        } catch (sendError) {
            setError(sendError instanceof Error ? sendError.message : null)
        } finally {
            setIsSending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-white/5 pt-4 text-sm">
                <span className="min-w-0 text-secondary">{content.sendOfferPrompt}</span>
                <DialogTrigger asChild>
                    <Button type="button" variant="none" className="h-auto! w-auto! shrink-0 p-0! text-sm! font-medium! text-brand! shadow-none! hover:bg-transparent! hover:underline! hover:text-brand!">
                        {content.sendOfferLabel}
                    </Button>
                </DialogTrigger>
            </div>
            <SiteDialogContent compact title={content.sendOfferTitle} description={content.sendOfferDescription}>
                {sentTo ? (
                    <Alert color="success">{content.sendOfferSuccess.replaceAll("{email}", sentTo)}</Alert>
                ) : (
                    <form onSubmit={(event) => void submit(event)} className="space-y-5">
                        <EmailInput
                            aria-label={content.emailLabel}
                            name="offer-email"
                            autoComplete="email"
                            maxLength={254}
                            placeholder={content.emailPlaceholder}
                            value={email}
                            disabled={emailLocked || isSending}
                            onChange={(event) => setEmail(event.currentTarget.value)}
                            className="w-full!"
                        />
                        {blockedReason ? <Alert color="warning">{blockedReason}</Alert> : null}
                        {error ? <Alert color="error">{error}</Alert> : null}
                        <DialogFooter>
                            <Button
                                type="submit"
                                variant="normal"
                                disabled={!validEmail || isSending || Boolean(blockedReason)}
                                className="h-10! w-full! whitespace-nowrap bg-white! px-8! text-sm! text-primary! ring-1! ring-white/20! hover:bg-white/90!"
                            >
                                {isSending ? <ButtonLoader label={content.processingLabel} /> : content.sendOfferLabel}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </SiteDialogContent>
        </Dialog>
    )
}
